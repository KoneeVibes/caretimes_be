const { Order } = require("../../../model/order");
const { Cart } = require("../../../model/cart");
const Product = require("../../../model/product");
const User = require("../../../model/customer");
const {
	default: sendEmail,
} = require("../../../util/notification/resend/emailSender");
const {
	orderCancellationNotificationTemplate,
} = require("../../../view/order/cancellationNotification");

const cancelOrder = async (req, res) => {
	const { orderId } = req.params;
	if (!orderId) {
		return res.status(400).json({
			status: "fail",
			message: "Order id is required.",
		});
	}

	const session = await Order.startSession();
	try {
		session.startTransaction();

		const order = await Order.findOne({ id: orderId }).session(session);
		if (!order) {
			await session.abortTransaction();
			return res.status(404).json({
				status: "fail",
				message: "Order not found.",
			});
		}
		if (order.status !== "unfulfilled") {
			await session.abortTransaction();
			return res.status(400).json({
				status: "fail",
				message: "Only unfulfilled orders can be cancelled.",
			});
		}

		const quantityByProduct = new Map();
		for (const item of order.cartItems) {
			quantityByProduct.set(
				item.productId,
				(quantityByProduct.get(item.productId) || 0) + item.quantity,
			);
		}
		for (const [productId, quantity] of quantityByProduct) {
			const result = await Product.updateOne(
				{
					id: productId,
					sold: { $gte: quantity },
				},
				{
					$inc: {
						stock: quantity,
						sold: -quantity,
					},
				},
				{ session },
			);
			if (result.modifiedCount !== 1) {
				throw new Error(
					`Cannot restore product ${productId}: sold quantity is lower than the order quantity.`,
				);
			}
		}

		const cartIds = order.cartItems.map((item) => item.cartId);
		const cartResult = await Cart.updateMany(
			{
				id: { $in: cartIds },
				customerId: order.customerId,
			},
			{ $set: { status: "cancelled" } },
			{ session },
		);
		if (cartResult.matchedCount !== cartIds.length) {
			throw new Error("One or more order cart items could not be found.");
		}

		order.status = "cancelled";
		await order.save({ session });

		const customer = await User.findOne({ id: order.customerId }).session(
			session,
		);
		if (!customer) {
			return res.status(404).json({
				status: "fail",
				message: "Customer not found. Contact administrator",
			});
		}

		const templateConfig = {
			customerName: `${customer.firstName} ${customer.lastName}`,
			orderNumber: order.transactionReference,
			orderDate: order.createdAt,
			totalAmount: order.totalPayable,
			paymentStatus: "Paid",
		};
		const html = orderCancellationNotificationTemplate(templateConfig);
		const mailConfig = {
			email: customer.email,
			html,
			subject: `Order Cancelled — Caretimes Cosmetics Order #${order.transactionReference}`,
		};
		await sendEmail(mailConfig);

		await session.commitTransaction();
		return res.status(200).json({
			status: "success",
			message: "Order cancelled and product stock restored.",
		});
	} catch (error) {
		await session.abortTransaction();
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message: "Unable to cancel order. Please retry.",
		});
	} finally {
		await session.endSession();
	}
};

module.exports = cancelOrder;

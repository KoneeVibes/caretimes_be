const User = require("../../../model/customer");
const { Order } = require("../../../model/order");
const {
	orderFulfillmentNotificationTemplate,
} = require("../../../view/order/fulfillmentNotification");
const {
	default: sendEmail,
} = require("../../../util/notification/resend/emailSender");

const fulfillOrder = async (req, res) => {
	const { orderId } = req.params;
	if (!orderId) {
		return res.status(400).json({
			status: "fail",
			message: "Order id is required.",
		});
	}

	try {
		const order = await Order.findOneAndUpdate(
			{ id: orderId, status: "paid" },
			{ $set: { status: "fulfilled" } },
			{ new: true, runValidators: true },
		);
		if (order) {
			const customer = await User.findOne({
				id: order.customerId,
			});
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
			const html = orderFulfillmentNotificationTemplate(templateConfig);
			const mailConfig = {
				email: customer.email,
				html,
				subject: `Your Order Is on Its Way! — Caretimes Cosmetics #${order.transactionReference}`,
			};
			await sendEmail(mailConfig);

			return res.status(200).json({
				status: "success",
				message: "Order fulfilled successfully.",
				data: { order },
			});
		}

		const existingOrder = await Order.findOne({ id: orderId }).select("status");
		if (!existingOrder) {
			return res.status(404).json({
				status: "fail",
				message: "Order not found.",
			});
		}

		return res.status(400).json({
			status: "fail",
			message: `Only paid orders can be fulfilled. This order is "${existingOrder.status}".`,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message: "Unable to fulfill order. Please retry.",
		});
	}
};

module.exports = fulfillOrder;

const { Cart } = require("../../../model/cart");
const { Order } = require("../../../model/order");
const isValidString = require("../../../helper/isValidString");

const chargeSuccess = async (event) => {
	const { reference } = event || {};

	if (![reference].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid transaction reference, Cannot Proceed",
		});
	}

	try {
		const foundOrder = await Order.findOne({ transactionReference: reference });
		if (!foundOrder) {
			return {
				status: "fail",
				message: "Order not found. Contact administrator",
			};
		}

		// tie cart update to order update as a single atomic transaction
		const updatedOrder = await Order.findOneAndUpdate(
			{ transactionReference: reference },
			{ $set: { status: "paid" } },
			{ new: true },
		);
		if (!updatedOrder) {
			return {
				status: "fail",
				message: "Order failed to update. Contact administrator",
			};
		}

		const cartIds = foundOrder.cartItems?.map((item) => item.cartId);
		const updatedCart = await Cart.updateMany(
			{
				id: { $in: cartIds },
				customerId: foundOrder.customerId,
				status: "unpaid",
			},
			{
				$set: { status: "paid" },
			},
		);
		if (!updatedCart) {
			return {
				status: "fail",
				message: "Cart failed to update. Contact administrator",
			};
		}
		return {
			status: "success",
			message: "Cart and order statuses updated successfully",
		};
	} catch (error) {
		console.error(
			`Server encountered an issue in updating cart status to paid. Please retry ${error}`,
		);
		return {
			status: "fail",
			message:
				"Server encountered an issue with actions in the charge.success event",
		};
	}
};

module.exports = chargeSuccess;

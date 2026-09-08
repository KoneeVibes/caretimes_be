const { Cart } = require("../../../model/cart");
const { Order } = require("../../../model/order");
const dbConnect = require("../../../db/dbConnect");
const isValidString = require("../../../helper/isValidString");

const chargeSuccess = async (event) => {
	const { reference } = event || {};

	if (![reference].every(isValidString)) {
		return {
			status: "fail",
			message: "Invalid transaction reference, Cannot Proceed",
		};
	}

	const session = await dbConnect.startSession();
	session.startTransaction();

	try {
		const foundOrder = await Order.findOne({
			transactionReference: reference,
		}).session(session);
		if (!foundOrder) {
			await session.abortTransaction();
			return {
				status: "fail",
				message: "Order not found. Contact administrator",
			};
		}

		// tie cart update to order update as a single atomic transaction
		const updatedOrder = await Order.findOneAndUpdate(
			{ transactionReference: reference },
			{ $set: { status: "paid" } },
			{ new: true, session },
		);
		if (!updatedOrder) {
			await session.abortTransaction();
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
			{ session },
		);
		if (!updatedCart) {
			await session.abortTransaction();
			return {
				status: "fail",
				message: "Cart failed to update. Contact administrator",
			};
		}

		// we will create a transaction record - that we will configure that table and add a record anytime a payment is successful. This will help us track all transactions and also help us in case of any disputes or chargebacks.
		await session.commitTransaction();
		return {
			status: "success",
			message: "Cart and order statuses updated successfully",
		};
	} catch (error) {
		console.error(
			`Server encountered an issue in updating cart status to paid. Please retry ${error}`,
		);
		await session.abortTransaction();
		return {
			status: "fail",
			message:
				"Server encountered an issue with actions in the charge.success event",
		};
	} finally {
		await session.endSession();
	}
};

module.exports = chargeSuccess;

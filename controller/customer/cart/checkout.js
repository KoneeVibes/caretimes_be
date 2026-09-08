const { v4: uuidv4 } = require("uuid");
const { Cart } = require("../../../model/cart");
const { Order } = require("../../../model/order");
const dbConnect = require("../../../db/dbConnect");
const Customer = require("../../../model/customer");
const isValidString = require("../../../helper/isValidString");
const initializeTransaction = require("../../../util/initializeTransaction");
const { default: nairaToKobo } = require("../../../helper/convertNairaToKobo");

const checkout = async (req, res) => {
	const { id } = req.user || {};
	const allProduct = req.body || [];

	if (![id].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid user id, Cannot Proceed",
		});
	}

	if (!Array.isArray(allProduct) || allProduct.length === 0) {
		return res.status(400).json({
			status: "fail",
			message: "Cart cannot be empty.",
		});
	}

	const session = await dbConnect.startSession();
	session.startTransaction();

	try {
		const foundCustomer = await Customer.findOne({
			id,
			status: "active",
		}).session(session);
		if (!foundCustomer) {
			await session.abortTransaction();
			return res.status(404).json({
				status: "fail",
				message: "Customer not found.",
			});
		}

		const cartIds = allProduct.map((item) => item.cartId);
		const carts = await Cart.find({
			id: { $in: cartIds },
			customerId: id,
			status: "unpaid",
		}).session(session);
		if (carts.length !== cartIds.length) {
			await session.abortTransaction();
			return res.status(400).json({
				status: "fail",
				message: "One or more cart items are invalid or no longer available.",
			});
		}

		const amount = carts.reduce(
			(total, cart) => total + cart.unitPrice * cart.quantity,
			0,
		);
		const queryParams = {
			email: foundCustomer?.email,
			amount: nairaToKobo(amount),
		};

		// tie transaction initialization to order creation as a single atomic transaction
		const transaction = await initializeTransaction(queryParams);
		if (!transaction.status) {
			await session.abortTransaction();
			return res.status(404).json({
				status: "fail",
				message:
					"Transaction failed to initialize. Please contact administrator.",
			});
		}
		const accessCode = transaction?.data.access_code;
		const reference = transaction?.data.reference;

		const orderCartItems = carts?.map((cart) => ({
			cartId: cart.id,
			productId: cart.productId,
			quantity: cart.quantity,
			unitPrice: cart.unitPrice,
		}));

		// tie transaction initialization to order creation as a single atomic transaction
		const order = new Order({
			id: uuidv4(),
			customerId: id,
			cartItems: orderCartItems,
			transactionAccessCode: accessCode,
			transactionReference: reference,
		});
		const savedOrder = await order.save({ session });
		if (!savedOrder) {
			await session.abortTransaction();
			return res.status(500).json({
				status: "fail",
				message:
					"Server encountered an issue saving this order to the db. Please contact support",
			});
		}

		await session.commitTransaction();
		return res.status(200).json({
			status: "success",
			message: "Cart checkout completed and order created successfully",
			data: {
				accessCode,
				reference,
			},
		});
	} catch (error) {
		console.error(error);
		await session.abortTransaction();
		return res.status(500).json({
			status: "fail",
			message: "Server encountered an issue in checking out cart. Please retry",
		});
	} finally {
		await session.endSession();
	}
};

module.exports = checkout;

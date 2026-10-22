const { Cart } = require("../../../model/cart");
const { Order } = require("../../../model/order");
const dbConnect = require("../../../db/dbConnect");
const isValidString = require("../../../helper/isValidString");
const {
	default: sendEmail,
} = require("../../../util/notification/resend/emailSender");
const {
	orderSuccessNotificationTemplate,
} = require("../../../view/order/successNotification");
const koboToNaira = require("../../../helper/convertKoboToNaira");
const transactionReceiptTemplate = require("../../../view/transaction/receipt");
const generatePDF = require("../../../util/pdf/puppeteer/generatePDF");

const chargeSuccess = async (event) => {
	const {
		reference,
		channel,
		authorization,
		paid_at,
		status,
		customer,
		amount,
	} = event || {};

	// if (![reference].every(isValidString)) {
	if (![reference, channel, status].every(isValidString)) {
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

		const templateConfig = {
			customerName: `${customer.first_name} ${customer.last_name}`,
			orderNumber: foundOrder.transactionReference,
			orderDate: foundOrder.createdAt,
			totalAmount: foundOrder.totalPayable,
			paymentStatus: "Paid",
		};
		const html = orderSuccessNotificationTemplate(templateConfig);
		const query = {
			amount: `₦${koboToNaira(amount)}`,
			reference,
			channel: channel
				?.replace(/_/g, " ")
				.replace(/\b\w/g, (character) => character.toUpperCase()),
			bank: authorization?.bank,
			customerEmail: customer?.email,
			transactionDate: paid_at,
			transactionStatus: status,
		};
		const template = transactionReceiptTemplate(query);
		const buffer = await generatePDF(template);
		const mailConfig = {
			email: customer.email,
			html,
			subject: `Order Confirmed! Your Caretimes Cosmetics Order #${foundOrder.transactionReference}`,
			attachments: [
				{
					filename: `receipt-${reference}.pdf`,
					content: buffer,
				},
			],
		};
		await sendEmail(mailConfig);

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

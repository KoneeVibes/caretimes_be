const generatePDF = require("../../../util/pdf/puppeteer/generatePDF");
const koboToNaira = require("../../../helper/convertKoboToNaira");
const transactionReceiptTemplate = require("../../../view/transaction/receipt");
const verifyTransaction = require("../../../util/payment/paystack/verifyTransaction");

const downloadTransactionReceipt = async (req, res) => {
	const { transactionId } = req.params || {};
	if (!transactionId) {
		return res.status(400).json({
			status: "fail",
			message: "Transaction Id not found, cannot proceed",
		});
	}

	try {
		const result = await verifyTransaction(transactionId);
		const transaction = result.data;

		if (!transaction) {
			return res.status(404).json({
				status: "fail",
				message: "Transaction not found",
			});
		}

		const query = {
			amount: `₦${koboToNaira(transaction?.amount)}`,
			reference: transaction?.reference,
			channel: transaction?.channel
				?.replace(/_/g, " ")
				.replace(/\b\w/g, (character) => character.toUpperCase()),
			bank: transaction?.authorization?.bank,
			customerEmail: transaction?.customer?.email,
			transactionDate: transaction?.paid_at,
			transactionStatus: transaction?.status,
		};

		const template = transactionReceiptTemplate(query);
		const buffer = await generatePDF(template);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			'attachment; filename="transaction_receipt.pdf"',
		);
		res.setHeader("Content-Length", buffer.length);

		return res.status(200).end(buffer);
	} catch (error) {
		console.error("Failed to download transaction receipt:", error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue downloading transaction receipt at this moment. Please retry.",
		});
	}
};

module.exports = downloadTransactionReceipt;

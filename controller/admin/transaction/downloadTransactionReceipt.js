const generatePDF = require("../../../util/pdf/puppeteer/generatePDF");
const koboToNaira = require("../../../helper/convertKoboToNaira");
const fetchTransaction = require("../../../util/payment/paystack/fetchTransaction");
const transactionReceiptTemplate = require("../../../view/transaction/receipt");

const downloadTransactionReceipt = async (req, res) => {
	const { transactionId } = req.params || {};
	if (!transactionId) {
		return res.status(400).json({
			status: "fail",
			message: "Transaction Id not found, cannot proceed",
		});
	}

	try {
		const result = await fetchTransaction(transactionId);
		const query = {
			amount: `₦${koboToNaira(result?.data?.amount)}`,
			reference: result?.data?.reference,
			channel: result?.data?.channel
				?.replace(/_/g, " ")
				.replace(/\b\w/g, (character) => character.toUpperCase()),
			bank: result?.data?.authorization?.bank,
			customerEmail: result?.data?.customer?.email,
			transactionDate: result?.data?.paid_at,
			transactionStatus: result?.data?.status,
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
		console.error("Failed to retrieve transaction:", error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue retrieving transaction at this moment. Please retry.",
		});
	}
};

module.exports = downloadTransactionReceipt;

const koboToNaira = require("../../../helper/convertKoboToNaira");
const listTransactions = require("../../../util/listTransactions");

const DASHBOARD_CURRENCY = "NGN";

const computeSales = async (status) => {
	const perPage = 100;
	let page = 1;
	let pageCount = 1;
	let transactionCount = 0;
	let totalAmount = 0;

	while (page <= pageCount) {
		const params = { page, perPage };
		if (["success", "failed", "abandoned"].includes(status)) {
			params.status = status;
		}

		const result = await listTransactions(params);
		pageCount = result.meta.pageCount;

		for (const transaction of result.data) {
			if (transaction.currency !== DASHBOARD_CURRENCY) continue;

			transactionCount += 1;
			totalAmount += transaction.amount;
		}
		page += 1;
	}

	return {
		transactionCount,
		amount: koboToNaira(totalAmount),
	};
};

const retrieveTransactionOverview = async (req, res) => {
	const { id, type } = req.user;
	try {
		const query = ["super-admin", "admin"].includes(type) ? {} : {}; //we may want to scope overview based on say distributor id vs admin id

		const [
			allTransactions,
			successfulTransactions,
			failedTransactions,
			abandonedTransactions,
		] = await Promise.all([
			computeSales(),
			computeSales("success"),
			computeSales("failed"),
			computeSales("abandoned"),
		]);

		return res.status(200).json({
			status: "success",
			data: {
				total: allTransactions.amount,
				success: successfulTransactions.amount,
				failed: failedTransactions.amount,
				abandoned: abandonedTransactions.amount,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving transaction overview at this moment. Please retry",
		});
	}
};

module.exports = retrieveTransactionOverview;

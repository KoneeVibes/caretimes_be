const listTransactions = require("../../../util/listTransactions");

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
			listTransactions({ page: 1, perPage: 1 }),
			listTransactions({ page: 1, perPage: 1, status: "success" }),
			listTransactions({ page: 1, perPage: 1, status: "failed" }),
			listTransactions({ page: 1, perPage: 1, status: "abandoned" }),
		]);

		return res.status(200).json({
			status: "success",
			data: {
				total: allTransactions.meta.total,
				success: successfulTransactions.meta.total,
				failed: failedTransactions.meta.total,
				abandoned: abandonedTransactions.meta.total,
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

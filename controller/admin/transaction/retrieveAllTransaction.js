const listTransactions = require("../../../util/listTransactions");

const retrieveAllTransaction = async (req, res) => {
	const { type } = req.user;
	const { filter, page, perPage } = req.query || {};

	try {
		const allowableStatuses = ["failed", "success", "abandoned"];

		const pageNumber = Math.max(Number(page) || 1, 1);
		const limit = Math.min(Math.max(Number(perPage) || 10, 1), 100);
		const status =
			["super-admin", "admin"].includes(type) &&
			allowableStatuses.includes(filter)
				? filter
				: null; // we may want to scope overview based on say distributor id vs admin id
		const query = {
			page: pageNumber,
			perPage: limit,
			...(status ? { status } : {}),
		};
		const result = await listTransactions(query);

		return res.status(200).json({
			status: "success",
			message: "Transactions retrieved successfully",
			data: result.data,
			meta: {
				page: result.meta.page,
				total: result.meta.total,
				perPage: result.meta.perPage,
				totalPages: result.meta.pageCount,
			},
		});
	} catch (error) {
		console.error("Failed to retrieve orders:", error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue retrieving transactions at this moment. Please retry.",
		});
	}
};

module.exports = retrieveAllTransaction;

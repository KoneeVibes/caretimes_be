const { Order } = require("../../../model/order");

const retrieveOrderOverview = async (req, res) => {
	const { id, type } = req.user;
	try {
		const query = ["super-admin", "admin"].includes(type)
			? {}
			: { insertedBy: id };
		const [total, paid, disputed, cancelled, fulfilled, unfulfilled] =
			await Promise.all([
				Order.countDocuments({ ...query }),
				Order.countDocuments({ ...query, status: "paid" }),
				Order.countDocuments({ ...query, status: "disputed" }),
				Order.countDocuments({ ...query, status: "cancelled" }),
				Order.countDocuments({ ...query, status: "fulfilled" }),
				Order.countDocuments({ ...query, status: "unfulfilled" }),
			]);
		res.status(200).json({
			status: "success",
			data: {
				paidProduct: paid,
				totalProduct: total,
				disputedProduct: disputed,
				cancelledProduct: cancelled,
				fulfilledProduct: fulfilled,
				unfulfilledProduct: unfulfilled,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving order overview at this moment. Please retry",
		});
	}
};

module.exports = retrieveOrderOverview;

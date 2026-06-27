const Product = require("../../../model/product");

const retrieveProductOverview = async (req, res) => {
	const { id, type } = req.user;
	try {
		const query = ["super-admin", "admin"].includes(type)
			? {}
			: { insertedBy: id };
		const [total, active, pending, disabled] = await Promise.all([
			Product.countDocuments({ ...query }),
			Product.countDocuments({ ...query, status: "active" }),
			Product.countDocuments({ ...query, status: "pending" }),
			Product.countDocuments({ ...query, status: "disabled" }),
		]);
		res.status(200).json({
			status: "success",
			data: {
				totalProduct: total,
				activeProduct: active,
				pendingProduct: pending,
				disabledProduct: disabled,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving product overview at this moment. Please retry",
		});
	}
};

module.exports = retrieveProductOverview;

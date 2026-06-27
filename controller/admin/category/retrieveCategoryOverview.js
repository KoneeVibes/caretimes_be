const Category = require("../../../model/category");

const retrieveCategoryOverview = async (req, res) => {
	const { id, type } = req.user;
	try {
		const query = ["super-admin", "admin"].includes(type)
			? { status: { $nin: ["defunct", "inactive"] } }
			: { status: { $nin: ["defunct", "inactive"] }, insertedBy: id };
		const [total] = await Promise.all([Category.countDocuments(query)]);
		res.status(200).json({
			status: "success",
			data: {
				totalCategory: total,
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

module.exports = retrieveCategoryOverview;

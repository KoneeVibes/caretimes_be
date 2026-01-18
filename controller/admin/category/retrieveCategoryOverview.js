const Category = require("../../../model/category");

const retrieveCategoryOverview = async (req, res) => {
	try {
		const [total] = await Promise.all([Category.countDocuments()]);
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

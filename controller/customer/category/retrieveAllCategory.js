const Category = require("../../../model/category");

const retrieveAllCategory = async (req, res) => {
	try {
		const categories = await Category.find(
			{ status: { $nin: ["defunct"] } },
			{ _id: 0, id: 1, name: 1, description: 1, thumbnail: 1, status: 1 }
		);
		if (!categories.length > 0) {
			return res.status(404).json({
				status: "success",
				message: "Categories not found",
			});
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: categories,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving categories at this moment. Please retry",
		});
	}
};

module.exports = retrieveAllCategory;

const Category = require("../../../model/category");

const retrieveCategoryById = async (req, res) => {
	const { categoryId } = req.params || {};
	if (!categoryId) {
		return res.status(400).json({
			status: "fail",
			message: "Category Id not found, Cannot Proceed",
		});
	}
	try {
		const category = await Category.findOne(
			{ id: categoryId, status: { $nin: ["defunct"] } },
			{ _id: 0, id: 1, name: 1, description: 1, thumbnail: 1, status: 1 }
		);
		if (!category) {
			return res.status(404).json({
				status: "success",
				message: "Category not found",
			});
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: category,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving category at this moment. Please retry",
		});
	}
};

module.exports = retrieveCategoryById;

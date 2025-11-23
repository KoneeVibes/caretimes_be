const Category = require("../../../model/category");

const deleteCategory = async (req, res) => {
	const { categoryId } = req.params || {};
	if (!categoryId) {
		return res.status(400).json({
			status: "fail",
			message: "Category Id not found, Cannot Proceed",
		});
	}
	try {
		const updatedCategory = await Category.findOneAndUpdate(
			{ id: categoryId },
			{ status: "defunct" },
			{ new: true }
		);
		if (!updatedCategory) {
			return res.status(404).json({
				status: "success",
				message: "Category not found",
			});
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: updatedCategory,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in deleting this category. Please retry",
		});
	}
};

module.exports = deleteCategory;

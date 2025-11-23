const Category = require("../../../model/category");
const isValidString = require("../../../helper/isValidString");

const updateCategory = async (req, res) => {
	const { categoryId } = req.params || {};
	const { name, description, status } = req.body || {};
	if (![name, status].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid Name or Status, Cannot Proceed",
		});
	}
	try {
		const updatedCategory = await Category.findOneAndUpdate(
			{ id: categoryId, status: { $nin: ["defunct"] } },
			{ name, description, status },
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
				"Server encountered an issue in updating this category. Please retry",
		});
	}
};

module.exports = updateCategory;

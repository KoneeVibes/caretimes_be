const { v2: cloudinary } = require("cloudinary");
const Category = require("../../../model/category");
const isValidString = require("../../../helper/isValidString");

const updateCategory = async (req, res) => {
	const { categoryId } = req.params || {};
	const thumbnail = req.file?.path || null;
	const { name, description, status } = req.body || {};
	if (![name, status].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid Name or Status, Cannot Proceed",
		});
	}
	try {
		const foundCategory = await Category.findOne({
			id: categoryId,
			status: { $nin: ["defunct"] },
		});
		if (!foundCategory) {
			return res.status(404).json({
				status: "fail",
				message: "Category not found.",
			});
		}
		const oldThumbnail = foundCategory?.thumbnail;

		const updatedCategory = await Category.findOneAndUpdate(
			{ id: categoryId, status: { $nin: ["defunct"] } },
			{ name, description, thumbnail, status },
			{ new: true }
		);
		if (!updatedCategory) {
			return res.status(404).json({
				status: "success",
				message: "Category not found",
			});
		}

		if (thumbnail && oldThumbnail) {
			const oldThumbnailCloudinaryId = oldThumbnail
				?.split("/")
				.pop()
				.split(".")[0];
			await cloudinary.uploader.destroy(`category/${oldThumbnailCloudinaryId}`);
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

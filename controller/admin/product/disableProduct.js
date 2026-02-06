const User = require("../../../model/user");
const Product = require("../../../model/product");
const isValidString = require("../../../helper/isValidString");

const disableProduct = async (req, res) => {
	const { id } = req.user || {};
	const { productId } = req.params || {};

	if (![id, productId].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid User or Product Id, Cannot Proceed",
		});
	}

	try {
		const foundUser = await User.findOne({ id: id, status: "active" });
		if (!foundUser || foundUser?.type !== "super-admin") {
			return res.status(404).json({
				status: "fail",
				message: "User not found or not authorized.",
			});
		}

		const foundProduct = await Product.findOne({
			id: productId,
			status: { $in: ["active", "inactive", "pending"] },
		});
		if (!foundProduct) {
			return res.status(404).json({
				status: "fail",
				message: "Product not found.",
			});
		}

		const updatedProduct = await Product.findOneAndUpdate(
			{ id: productId, status: { $in: ["active", "inactive", "pending"] } },
			{ status: "disabled" },
			{ new: true },
		);
		if (!updatedProduct) {
			return res.status(404).json({
				status: "fail",
				message: "Product disabling failed",
			});
		}

		res.status(200).json({
			status: "success",
			message: "success",
			data: updatedProduct,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in disabling this product. Please retry",
		});
	}
};

module.exports = disableProduct;

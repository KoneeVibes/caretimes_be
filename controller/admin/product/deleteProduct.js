const Product = require("../../../model/product");

const deleteProduct = async (req, res) => {
	const { productId } = req.params || {};
	if (!productId) {
		return res.status(400).json({
			status: "fail",
			message: "Product Id not found, Cannot Proceed",
		});
	}
	try {
		const updatedProduct = await Product.findOneAndUpdate(
			{ id: productId },
			{ status: "inactive" },
			{ new: true }
		);
		if (!updatedProduct) {
			return res.status(404).json({
				status: "success",
				message: "Product not found",
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
				"Server encountered an issue in deleting this product. Please retry",
		});
	}
};

module.exports = deleteProduct;

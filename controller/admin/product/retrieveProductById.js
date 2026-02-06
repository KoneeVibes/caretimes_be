const Product = require("../../../model/product");

const retrieveProductById = async (req, res) => {
	const { productId } = req.params || {};
	if (!productId) {
		return res.status(400).json({
			status: "fail",
			message: "Product Id not found, Cannot Proceed",
		});
	}
	try {
		const product = await Product.findOne(
			{
				id: productId,
				status: { $in: ["active", "inactive", "pending", "disabled"] },
			},
			{
				_id: 0,
				id: 1,
				name: 1,
				category: 1,
				stock: 1,
				sold: 1,
				price: 1,
				thumbnail: 1,
				images: 1,
				description: 1,
				status: 1,
			},
		);
		if (!product) {
			return res.status(404).json({
				status: "success",
				message: "Product not found",
			});
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: product,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving product at this moment. Please retry",
		});
	}
};

module.exports = retrieveProductById;

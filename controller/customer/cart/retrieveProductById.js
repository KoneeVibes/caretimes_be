const Cart = require("../../../model/cart");
const Product = require("../../../model/product");
const isValidString = require("../../../helper/isValidString");

const retrieveProductById = async (req, res) => {
	const { id } = req.user || {};
	const { productId } = req.params || {};

	if (![productId].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid Cart Item Id, Cannot Proceed",
		});
	}
	try {
		const foundProduct = await Product.findOne(
			{ id: productId },
			{ price: 1, stock: 1 },
		);
		if (!foundProduct) {
			return res.status(400).json({
				status: "fail",
				message: "Product not found 1",
			});
		}

		const productInCart = await Cart.findOne(
			{
				customerId: id,
				productId,
				unitPrice: foundProduct.price,
				status: "unpaid",
			},
			{
				_id: 0,
				id: 1,
				customerId: 1,
				productId: 1,
				unitPrice: 1,
				quantity: 1,
				status: 1,
			},
		);
		if (!productInCart) {
			return res.status(404).json({
				status: "success",
				message: "Product not found",
			});
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: productInCart,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving product in cart at this moment. Please retry",
		});
	}
};

module.exports = retrieveProductById;

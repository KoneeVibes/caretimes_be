const Cart = require("../../../model/cart");

const retrieveAllProductInCart = async (req, res) => {
	const { id } = req.user || {};
	try {
		const products = await Cart.find(
			{ customerId: id, status: "unpaid" },
			{
				_id: 0,
				id: 1,
				customerId: 1,
				productId: 1,
				unitPrice: 1,
				quantity: 1,
				status: 1,
			}
		).sort({ createdAt: 1 });
		res.status(200).json({
			status: "success",
			message: "success",
			data: products,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving products in cart at this moment. Please retry",
		});
	}
};

module.exports = retrieveAllProductInCart;

const Cart = require("../../../model/cart");
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
		const product = await Cart.find(
			{ customerId: id, productId, status: "unpaid" },
			{
				_id: 0,
				id: 1,
				customerId: 1,
				productId: 1,
				unitPrice: 1,
				quantity: 1,
				status: 1,
			}
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
				"Server encountered an issue in retrieving product in cart at this moment. Please retry",
		});
	}
};

module.exports = retrieveProductById;

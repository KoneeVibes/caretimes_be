const Cart = require("../../../model/cart");
const isValidString = require("../../../helper/isValidString");

const removeProductFromCart = async (req, res) => {
	const { id } = req.user || {};
	const { productId } = req.params || {};

	console.log(productId);
	if (![productId].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid Cart Item Id, Cannot Proceed",
		});
	}

	try {
		await Cart.findOneAndUpdate(
			{ id: productId, customerId: id, status: "unpaid" },
			{ status: "inactive" }
		);
		return res.status(200).json({
			status: "success",
			message: "Product removed from cart successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in removing product from cart. Please retry",
		});
	}
};

module.exports = removeProductFromCart;

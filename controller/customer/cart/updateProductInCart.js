const { v4: uuidv4 } = require("uuid");
const Cart = require("../../../model/cart");
const Product = require("../../../model/product");
const isValidString = require("../../../helper/isValidString");
const isValidNumber = require("../../../helper/isValidNumber");

const updateProductInCart = async (req, res) => {
	const { id } = req.user || {};
	const { quantity } = req.body || {};
	const { productId } = req.params || {};

	if (![productId].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid Cart Item Id, Cannot Proceed",
		});
	}
	if (![quantity].every(isValidNumber)) {
		return res.status(400).json({
			status: "fail",
			message: "Quantity must be number or numeric string",
		});
	}

	const qty = Number(quantity);
	if (qty <= 0) {
		return res.status(400).json({
			status: "fail",
			message: "Quantity cannot be negative or zero",
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
				message: "Product not found",
			});
		}
		const unitPrice = Number(foundProduct?.price);
		if (qty > foundProduct.stock) {
			return res.status(400).json({
				status: "fail",
				message: `Only ${foundProduct.stock} item(s) available in stock`,
			});
		}

		await Cart.findOneAndUpdate(
			{
				customerId: id,
				productId: productId,
				unitPrice: unitPrice,
				status: "unpaid",
			},
			{
				quantity: qty,
				$setOnInsert: {
					id: uuidv4(),
					customerId: id,
					productId: productId,
					unitPrice: unitPrice,
				},
			},
			{ upsert: true, new: true },
		);
		return res.status(200).json({
			status: "success",
			message: "Product updated in cart successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in updating product in cart. Please retry",
		});
	}
};

module.exports = updateProductInCart;

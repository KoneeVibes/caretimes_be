const { v4: uuidv4 } = require("uuid");
const Cart = require("../../../model/cart");
const Product = require("../../../model/product");
const isValidString = require("../../../helper/isValidString");
const isValidNumber = require("../../../helper/isValidNumber");

const addProductToCart = async (req, res) => {
	const { id } = req.user || {};
	const { product, quantity, price } = req.body || {};

	if (![product].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid Product Id, Cannot Proceed",
		});
	}
	if (![quantity, price].every(isValidNumber)) {
		return res.status(400).json({
			status: "fail",
			message: "Quantity and price must be numbers or numeric strings",
		});
	}

	const qty = Number(quantity);
	const unitPrice = Number(price);

	try {
		const foundProduct = await Product.findOne({ id: product }, { stock: 1 });
		if (!foundProduct) {
			return res.status(400).json({
				status: "fail",
				message: "Product not found",
			});
		}

		const existingCartItem = await Cart.findOne({
			customerId: id,
			productId: product,
			unitPrice,
			status: "unpaid",
		});
		const existingQty = existingCartItem?.quantity || 0;
		const newTotalQty = existingQty + qty;

		if (newTotalQty > foundProduct.stock) {
			return res.status(400).json({
				status: "fail",
				message: `Only ${foundProduct.stock} item(s) available in stock`,
			});
		}

		await Cart.findOneAndUpdate(
			{
				customerId: id,
				productId: product,
				unitPrice,
				status: "unpaid",
			},
			{
				$inc: { quantity: qty },
				$setOnInsert: {
					id: uuidv4(),
					customerId: id,
					productId: product,
					unitPrice,
				},
			},
			{ upsert: true, new: true },
		);
		return res.status(200).json({
			status: "success",
			message: "Product added to cart successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in adding product to cart. Please retry",
		});
	}
};

module.exports = addProductToCart;

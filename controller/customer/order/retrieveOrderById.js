const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const Category = require("../../../model/category");
const isValidString = require("../../../helper/isValidString");

const retrieveOrderById = async (req, res) => {
	const { id } = req.user || {};
	const { orderId } = req.params || {};

	if (![orderId].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid Order Id, Cannot Proceed",
		});
	}

	try {
		const query = {
			id: orderId,
			customerId: id,
			status: {
				$in: ["fulfilled", "paid"],
			},
		};

		const foundOrder = await Order.findOne(query);
		if (!foundOrder) {
			return res.status(404).json({
				status: "success",
				message: "No fulfilled or paid orders found",
			});
		}

		const order = foundOrder.toObject();
		order.cartItems = await Promise.all(
			order.cartItems.map(async (cartItem) => {
				const product = await Product.findOne({ id: cartItem.productId });
				if (!product) {
					return cartItem;
				}
				const category = await Category.findOne({ id: product.category });
				return {
					...cartItem,
					productName: product.name,
					productDescription: product.description,
					productCategory: category?.name,
					productImages: product ? product.images : [],
				};
			}),
		);

		return res.status(200).json({
			status: "success",
			message: "Order retrieved successfully",
			data: order,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving order at this moment. Please retry",
		});
	}
};

module.exports = retrieveOrderById;

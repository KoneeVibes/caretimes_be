const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const Category = require("../../../model/category");

const retrieveAllOrder = async (req, res) => {
	const { id } = req.user || {};
	try {
		const query = {
			customerId: id,
			status: {
				$in: ["fulfilled", "paid"],
			},
		};

		const foundOrders = await Order.find(query);
		if (!foundOrders || foundOrders.length === 0) {
			return res.status(404).json({
				status: "success",
				message: "No fulfilled or paid orders found",
			});
		}

		const orders = await Promise.all(
			foundOrders.map(async (order) => {
				const orderData = order.toObject();
				orderData.cartItems = await Promise.all(
					(orderData.cartItems || []).map(async (cartItem) => {
						const product = await Product.findOne({ id: cartItem.productId });
						const category = product
							? await Category.findOne({ id: product.category })
							: null;
						return {
							...cartItem,
							productName: product ? product.name : null,
							productCategory: category ? category.name : null,
							productImages: product ? product.images : [],
						};
					}),
				);
				return orderData;
			}),
		);

		return res.status(200).json({
			status: "success",
			message: "success",
			data: orders,
		});
	} catch (error) {
		console.error("Failed to retrieve orders:", error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue retrieving orders at this moment. Please retry.",
		});
	}
};

module.exports = retrieveAllOrder;

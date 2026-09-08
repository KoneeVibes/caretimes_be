const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const Customer = require("../../../model/customer");

const retrieveOrderById = async (req, res) => {
	const { id, type } = req.user;
	const { orderId } = req.params || {};

	if (!orderId) {
		return res.status(400).json({
			status: "fail",
			message: "Order Id not found, cannot proceed",
		});
	}

	try {
		const allowedStatuses = [
			"fulfilled",
			"paid",
			"unfulfilled",
			"cancelled",
			"disputed",
		];
		const query = ["super-admin", "admin"].includes(type)
			? {
					id: orderId,
					status: { $in: allowedStatuses },
				}
			: {
					id: orderId,
					insertedBy: id,
					status: { $in: allowedStatuses },
				};

		const order = await Order.findOne(query, {
			_id: 0,
			id: 1,
			customerId: 1,
			transactionAccessCode: 1,
			transactionReference: 1,
			cartItems: 1,
			subTotal: 1,
			deliveryFee: 1,
			tax: 1,
			discount: 1,
			totalPayable: 1,
			status: 1,
			createdAt: 1,
		})
			.lean()
			.exec();
		if (!order) {
			return res.status(404).json({
				status: "fail",
				message: "Order not found",
			});
		}

		const productIds = [
			...new Set(
				(order.cartItems || [])
					.map((cartItem) => cartItem.productId)
					.filter(Boolean),
			),
		];
		const [customer, products] = await Promise.all([
			Customer.findOne(
				{ id: order.customerId },
				{
					_id: 0,
					id: 1,
					firstName: 1,
					lastName: 1,
					houseNumber: 1,
					street: 1,
					location: 1,
				},
			)
				.lean()
				.exec(),
			Product.find(
				{ id: { $in: productIds } },
				{
					_id: 0,
					id: 1,
					name: 1,
					images: 1,
				},
			)
				.lean()
				.exec(),
		]);

		const customerName = customer
			? [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
				null
			: null;
		const deliveryAddress = customer
			? [customer.houseNumber, customer.street, customer.location]
					.filter(Boolean)
					.join(" ") || null
			: null;
		const productsById = new Map(
			products.map((product) => [String(product.id), product]),
		);

		const data = {
			...order,
			customerName,
			deliveryAddress,
			cartItems: (order.cartItems || []).map((cartItem) => {
				const product = productsById.get(String(cartItem.productId));

				return {
					...cartItem,
					productName: product?.name ?? null,
					productImages: product?.images ?? [],
				};
			}),
		};
		return res.status(200).json({
			status: "success",
			message: "success",
			data,
		});
	} catch (error) {
		console.error("Failed to retrieve order:", error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue retrieving the order at this moment. Please retry.",
		});
	}
};

module.exports = retrieveOrderById;

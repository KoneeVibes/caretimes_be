const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const Customer = require("../../../model/customer");

const retrieveAllOrder = async (req, res) => {
	const { id, type } = req.user;
	const { filter, page, perPage } = req.query || {};

	try {
		const statusFilter = Array.isArray(filter)
			? { $in: filter }
			: filter
				? filter
				: {
						$in: ["fulfilled", "paid", "unfulfilled", "cancelled", "disputed"],
					};

		const query = ["super-admin", "admin"].includes(type)
			? { status: statusFilter }
			: { status: statusFilter, insertedBy: id };

		const pageNumber = Math.max(Number(page) || 1, 1);
		const limit = Math.min(Math.max(Number(perPage) || 10, 1), 100);
		const skip = (pageNumber - 1) * limit;

		const [total, orders] = await Promise.all([
			Order.countDocuments(query),
			Order.find(query, {
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
			})
				.skip(skip)
				.limit(limit)
				.lean()
				.exec(),
		]);

		const customerIds = [
			...new Set(orders.map((order) => order.customerId).filter(Boolean)),
		];
		const productIds = [
			...new Set(
				orders.flatMap((order) =>
					(order.cartItems || [])
						.map((cartItem) => cartItem.productId)
						.filter(Boolean),
				),
			),
		];

		const [customers, products] = await Promise.all([
			Customer.find(
				{ id: { $in: customerIds } },
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

		const customerNamesById = new Map(
			customers.map((customer) => [
				String(customer.id),
				[customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
					null,
			]),
		);
		const customerDropoffById = new Map(
			customers.map((customer) => [
				String(customer.id),
				[customer.houseNumber, customer.street, customer.location]
					.filter(Boolean)
					.join(" ") || null,
			]),
		);
		const productNamesById = new Map(
			products.map((product) => [String(product.id), product.name || null]),
		);
		const productImagesById = new Map(
			products.map((product) => [String(product.id), product.images || null]),
		);

		const data = orders.map((order) => ({
			...order,
			customerName: customerNamesById.get(String(order.customerId)) ?? null,
			deliveryAddress:
				customerDropoffById.get(String(order.customerId)) ?? null,
			cartItems: (order.cartItems || []).map((cartItem) => ({
				...cartItem,
				productName: productNamesById.get(String(cartItem.productId)) ?? null,
				productImages: productImagesById.get(String(cartItem.productId)) ?? [],
			})),
		}));
		return res.status(200).json({
			status: "success",
			message: "success",
			data,
			meta: {
				page: pageNumber,
				perPage: limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
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

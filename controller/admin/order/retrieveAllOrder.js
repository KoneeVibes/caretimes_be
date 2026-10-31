const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const Customer = require("../../../model/customer");

const roundMoney = (amount) =>
	Math.round((amount + Number.EPSILON) * 100) / 100;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const calculateOrderTotalsForItems = (order, cartItems) => {
	const subTotal = roundMoney(
		cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
	);

	const originalSubTotal = Number(order.subTotal) || 0;
	const allocationRatio =
		originalSubTotal > 0 ? subTotal / originalSubTotal : 0;

	const deliveryFee = roundMoney(
		(Number(order.deliveryFee) || 0) * allocationRatio,
	);
	const tax = roundMoney((Number(order.tax) || 0) * allocationRatio);
	const discount = roundMoney((Number(order.discount) || 0) * allocationRatio);

	const totalPayable = roundMoney(subTotal + deliveryFee + tax - discount);

	return {
		subTotal,
		deliveryFee,
		tax,
		discount,
		totalPayable,
	};
};

const retrieveAllOrder = async (req, res) => {
	const { id, type } = req.user;
	const { filter, page, perPage, q } = req.query || {};

	try {
		const statusFilter = Array.isArray(filter)
			? { $in: filter }
			: filter || {
					$in: ["fulfilled", "paid", "unfulfilled", "cancelled", "disputed"],
				};

		const query = { status: statusFilter };
		let ownedProductIds = null;

		if (!["super-admin", "admin"].includes(type)) {
			const products = await Product.find({ insertedBy: id }, { _id: 0, id: 1 })
				.lean()
				.exec();

			ownedProductIds = new Set(products.map((product) => String(product.id)));

			query.cartItems = {
				$elemMatch: {
					productId: { $in: [...ownedProductIds] },
				},
			};
		}

		const searchTerm = typeof q === "string" ? q.trim() : "";

		if (searchTerm) {
			const searchRegex = new RegExp(escapeRegex(searchTerm), "i");

			const [customers, matchingProducts] = await Promise.all([
				Customer.find(
					{
						$or: [
							{ firstName: searchRegex },
							{ middleName: searchRegex },
							{ lastName: searchRegex },
							{ location: searchRegex },
						],
					},
					{ _id: 0, id: 1 },
				)
					.lean()
					.exec(),
				Product.find({ name: searchRegex }, { _id: 0, id: 1 }).lean().exec(),
			]);

			const matchingCustomerIds = customers.map((customer) => customer.id);
			const matchingProductIds = matchingProducts.map((product) => product.id);

			const searchConditions = [
				{ transactionReference: searchRegex },
				{ transactionAccessCode: searchRegex },
				{ status: searchRegex },
				{ customerId: { $in: matchingCustomerIds } },
			];

			const visibleMatchingProductIds =
				ownedProductIds === null
					? matchingProductIds
					: matchingProductIds.filter((productId) =>
							ownedProductIds.has(String(productId)),
						);

			searchConditions.push({
				"cartItems.productId": { $in: visibleMatchingProductIds },
			});

			query.$or = searchConditions;
		}

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
				createdAt: 1,
			})
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean()
				.exec(),
		]);

		if (orders.length === 0) {
			return res.status(404).json({
				status: "success",
				message: "Orders not found",
			});
		}

		const visibleOrders =
			ownedProductIds === null
				? orders
				: orders.map((order) => ({
						...order,
						cartItems: (order.cartItems || []).filter((cartItem) =>
							ownedProductIds.has(String(cartItem.productId)),
						),
					}));

		const customerIds = [
			...new Set(
				visibleOrders.map((order) => order.customerId).filter(Boolean),
			),
		];

		const productIds = [
			...new Set(
				visibleOrders.flatMap((order) =>
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

		const data = visibleOrders.map((order) => {
			const totals =
				ownedProductIds === null
					? {}
					: calculateOrderTotalsForItems(order, order.cartItems || []);

			return {
				...order,
				...totals,
				customerName: customerNamesById.get(String(order.customerId)) ?? null,
				deliveryAddress:
					customerDropoffById.get(String(order.customerId)) ?? null,
				cartItems: (order.cartItems || []).map((cartItem) => ({
					...cartItem,
					productName: productNamesById.get(String(cartItem.productId)) ?? null,
					productImages:
						productImagesById.get(String(cartItem.productId)) ?? [],
				})),
			};
		});

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

const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const Customer = require("../../../model/customer");
const User = require("../../../model/user");

const roundMoney = (amount) =>
	Math.round((amount + Number.EPSILON) * 100) / 100;

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
		const isAdmin = ["super-admin", "admin"].includes(type);

		let ownedProductIds = null;
		const orderQuery = {
			id: orderId,
			status: { $in: allowedStatuses },
		};

		if (!isAdmin) {
			const ownedProducts = await Product.find(
				{ insertedBy: id },
				{ _id: 0, id: 1 },
			)
				.lean()
				.exec();

			ownedProductIds = new Set(
				ownedProducts.map((product) => String(product.id)),
			);

			orderQuery.cartItems = {
				$elemMatch: {
					productId: { $in: [...ownedProductIds] },
				},
			};
		}

		const order = await Order.findOne(orderQuery, {
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

		const visibleCartItems =
			ownedProductIds === null
				? order.cartItems || []
				: (order.cartItems || []).filter((cartItem) =>
						ownedProductIds.has(String(cartItem.productId)),
					);

		const productIds = [
			...new Set(
				visibleCartItems.map((cartItem) => cartItem.productId).filter(Boolean),
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
					insertedBy: 1,
				},
			)
				.lean()
				.exec(),
		]);

		const distributorIds = [
			...new Set(
				products
					.map((product) => product.insertedBy)
					.filter(Boolean)
					.map(String),
			),
		];

		const distributors = distributorIds.length
			? await User.find(
					{
						id: { $in: distributorIds },
					},
					{
						_id: 0,
						id: 1,
						firstName: 1,
						lastName: 1,
						email: 1,
						phone: 1,
						organization: 1,
					},
				)
					.lean()
					.exec()
			: [];

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

		const totals =
			ownedProductIds === null
				? {}
				: calculateOrderTotalsForItems(order, visibleCartItems);

		const data = {
			...order,
			...totals,
			customerName,
			deliveryAddress,
			distributors: distributors.map((distributor) => ({
				name:
					[distributor.firstName, distributor.lastName]
						.filter(Boolean)
						.join(" ") || null,
				email: distributor.email ?? null,
				phone: distributor.phone ?? null,
				organization: distributor.organization ?? null,
			})),
			cartItems: visibleCartItems.map((cartItem) => {
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

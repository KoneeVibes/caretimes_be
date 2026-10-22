const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const koboToNaira = require("../../../helper/convertKoboToNaira");
const listTransactions = require("../../../util/payment/paystack/listTransactions");

const ALLOWED_STATUSES = ["failed", "success", "abandoned"];

const getDistributorAllocations = async (userId) => {
	const products = await Product.find(
		{ insertedBy: userId },
		{ _id: 0, id: 1 },
	).lean();

	const productIds = products.map((product) => product.id);
	const productIdSet = new Set(productIds.map(String));

	const orders = await Order.find(
		{
			cartItems: {
				$elemMatch: {
					productId: { $in: productIds },
				},
			},
		},
		{
			_id: 0,
			transactionReference: 1,
			subTotal: 1,
			cartItems: 1,
		},
	).lean();

	const allocationByReference = new Map();

	for (const order of orders) {
		if (!order.transactionReference) continue;

		const scopedSubTotal = (order.cartItems || []).reduce(
			(sum, item) =>
				productIdSet.has(String(item.productId))
					? sum + item.quantity * item.unitPrice
					: sum,
			0,
		);

		const orderSubTotal = Number(order.subTotal) || 0;
		const allocation =
			orderSubTotal > 0 ? Math.min(scopedSubTotal / orderSubTotal, 1) : 0;

		allocationByReference.set(order.transactionReference, allocation);
	}

	return allocationByReference;
};

const getAllTransactions = async (status = null) => {
	const perPage = 100;
	let page = 1;
	let pageCount = 1;
	const transactions = [];

	while (page <= pageCount) {
		const result = await listTransactions({
			page,
			perPage,
			...(status ? { status } : {}),
		});

		pageCount = result.meta.pageCount;
		transactions.push(...result.data);
		page += 1;
	}

	return transactions;
};

const retrieveAllTransaction = async (req, res) => {
	const { id, type } = req.user;
	const { filter, page, perPage } = req.query || {};

	try {
		const isAdmin = ["super-admin", "admin"].includes(type);
		const pageNumber = Math.max(Number(page) || 1, 1);
		const limit = Math.min(Math.max(Number(perPage) || 10, 1), 100);
		const status = isAdmin && ALLOWED_STATUSES.includes(filter) ? filter : null;

		if (isAdmin) {
			const result = await listTransactions({
				page: pageNumber,
				perPage: limit,
				...(status ? { status } : {}),
			});

			const transactions = result.data.map((item) => ({
				...item,
				amount: koboToNaira(item.amount),
			}));

			return res.status(200).json({
				status: "success",
				message: "Transactions retrieved successfully",
				data: transactions,
				meta: {
					page: result.meta.page,
					total: result.meta.total,
					perPage: result.meta.perPage,
					totalPages: result.meta.pageCount,
				},
			});
		}

		const allocationByReference = await getDistributorAllocations(id);
		const allTransactions = await getAllTransactions();
		const scopedTransactions = allTransactions.filter((transaction) =>
			allocationByReference.has(transaction.reference),
		);

		const total = scopedTransactions.length;
		const skip = (pageNumber - 1) * limit;
		const pageTransactions = scopedTransactions.slice(skip, skip + limit);

		const transactions = pageTransactions.map((item) => ({
			...item,
			amount: koboToNaira(
				item.amount * allocationByReference.get(item.reference),
			),
		}));

		return res.status(200).json({
			status: "success",
			message: "Transactions retrieved successfully",
			data: transactions,
			meta: {
				page: pageNumber,
				total,
				perPage: limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Failed to retrieve transactions:", error);

		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue retrieving transactions at this moment. Please retry.",
		});
	}
};

module.exports = retrieveAllTransaction;

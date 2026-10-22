const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const koboToNaira = require("../../../helper/convertKoboToNaira");
const listTransactions = require("../../../util/payment/paystack/listTransactions");

const DASHBOARD_CURRENCY = "NGN";
const ALLOWED_STATUSES = ["success", "failed", "abandoned"];

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

const getAllTransactions = async () => {
	const perPage = 100;
	let page = 1;
	let pageCount = 1;
	const transactions = [];

	while (page <= pageCount) {
		const result = await listTransactions({ page, perPage });
		pageCount = result.meta.pageCount;
		transactions.push(...result.data);
		page += 1;
	}

	return transactions;
};

const retrieveTransactionOverview = async (req, res) => {
	const { id, type } = req.user;

	try {
		const isAdmin = ["super-admin", "admin"].includes(type);
		const allocationByReference = isAdmin
			? null
			: await getDistributorAllocations(id);

		const transactions = await getAllTransactions();

		const totals = {
			total: 0,
			success: 0,
			failed: 0,
			abandoned: 0,
		};

		for (const transaction of transactions) {
			if (transaction.currency !== DASHBOARD_CURRENCY) continue;

			let allocation = 1;

			if (allocationByReference !== null) {
				allocation = allocationByReference.get(transaction.reference);
				if (allocation === undefined) continue;
			}

			const amount = transaction.amount * allocation;
			totals.total += amount;

			if (ALLOWED_STATUSES.includes(transaction.status)) {
				totals[transaction.status] += amount;
			}
		}

		return res.status(200).json({
			status: "success",
			data: {
				total: koboToNaira(totals.total),
				success: koboToNaira(totals.success),
				failed: koboToNaira(totals.failed),
				abandoned: koboToNaira(totals.abandoned),
			},
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an error retrieving transaction overview. Please retry.",
		});
	}
};

module.exports = retrieveTransactionOverview;

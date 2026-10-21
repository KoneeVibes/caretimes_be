const User = require("../../../model/user");
const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const Customer = require("../../../model/customer");
const { Cart } = require("../../../model/cart");
const listTransactions = require("../../../util/payment/paystack/listTransactions");
const koboToNaira = require("../../../helper/convertKoboToNaira");

const DASHBOARD_CURRENCY = "NGN";

const getBucketKey = (date, bucket) => {
	const isoDate = new Date(date).toISOString();
	return bucket === "month" ? isoDate.slice(0, 7) : isoDate.slice(0, 10);
};

const createBuckets = ({ from, to, bucket }) => {
	const buckets = [];
	const cursor = new Date(from);
	const end = new Date(to);

	if (bucket === "month") {
		cursor.setUTCDate(1);
	}

	while (cursor <= end) {
		const key = getBucketKey(cursor, bucket);

		const label = new Intl.DateTimeFormat("en-NG", {
			month: "short",
			day: bucket === "day" ? "numeric" : undefined,
			timeZone: "UTC",
		}).format(cursor);

		buckets.push({ key, label });

		if (bucket === "month") {
			cursor.setUTCMonth(cursor.getUTCMonth() + 1);
		} else {
			cursor.setUTCDate(cursor.getUTCDate() + 1);
		}
	}

	return buckets;
};

const getSuccessfulSales = async (allocationByReference = null) => {
	const perPage = 100;
	let page = 1;
	let pageCount = 1;
	let transactionCount = 0;
	let totalAmount = 0;

	while (page <= pageCount) {
		const result = await listTransactions({
			page,
			perPage,
			status: "success",
		});

		pageCount = result.meta.pageCount;

		for (const transaction of result.data) {
			if (transaction.currency !== DASHBOARD_CURRENCY) continue;

			let allocation = 1;

			if (allocationByReference !== null) {
				allocation = allocationByReference.get(transaction.reference);

				if (allocation === undefined) continue;
			}

			transactionCount += 1;
			totalAmount += transaction.amount * allocation;
		}

		page += 1;
	}

	return {
		currency: DASHBOARD_CURRENCY,
		transactionCount,
		amount: koboToNaira(totalAmount),
	};
};

const getSalesGraph = async (
	{ from, to, bucket },
	allocationByReference = null,
) => {
	const perPage = 100;
	let page = 1;
	let pageCount = 1;

	const buckets = createBuckets({ from, to, bucket });
	const salesByBucket = new Map(buckets.map(({ key }) => [key, 0]));

	while (page <= pageCount) {
		const result = await listTransactions({
			page,
			perPage,
			status: "success",
			from,
			to,
		});

		pageCount = result.meta.pageCount;

		for (const transaction of result.data) {
			if (transaction.currency !== DASHBOARD_CURRENCY) continue;

			let allocation = 1;

			if (allocationByReference !== null) {
				allocation = allocationByReference.get(transaction.reference);

				if (allocation === undefined) continue;
			}

			const transactionDate = transaction.paid_at || transaction.created_at;
			const key = getBucketKey(transactionDate, bucket);

			if (salesByBucket.has(key)) {
				salesByBucket.set(
					key,
					salesByBucket.get(key) + transaction.amount * allocation,
				);
			}
		}

		page += 1;
	}

	return {
		currency: DASHBOARD_CURRENCY,
		labels: buckets.map(({ label }) => label),
		data: buckets.map(({ key }) => koboToNaira(salesByBucket.get(key))),
	};
};

const getChartConfig = (period, value) => {
	const allowedPeriods = ["day", "month"];
	const numericValue = Number(value);

	if (
		!allowedPeriods.includes(period) ||
		!Number.isInteger(numericValue) ||
		numericValue < 1
	) {
		return null;
	}

	const now = new Date();
	let from;
	let bucket;

	if (period === "day") {
		from = new Date(now);
		from.setUTCHours(0, 0, 0, 0);
		from.setUTCDate(from.getUTCDate() - (numericValue - 1));
		bucket = "day";
	} else {
		from = new Date(now);
		bucket = numericValue === 1 ? "day" : "month";

		if (bucket === "day") {
			from.setUTCMonth(from.getUTCMonth() - 1);
			from.setUTCHours(0, 0, 0, 0);
		} else {
			from.setUTCMonth(from.getUTCMonth() - (numericValue - 1), 1);
			from.setUTCHours(0, 0, 0, 0);
		}
	}

	return {
		period,
		value: numericValue,
		bucket,
		from: from.toISOString(),
		to: now.toISOString(),
	};
};

const retrieveSystemOverview = async (req, res) => {
	const { id, type } = req.user;
	const { period = "day", value = "7" } = req.query ?? {};
	const chartConfig = getChartConfig(period, value);

	if (!chartConfig) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid period or value. Use a supported dashboard filter.",
		});
	}

	try {
		const isAdmin = ["super-admin", "admin"].includes(type);

		let scopedProductIds = null;
		let scopedOrderQuery = {};
		let allocationByReference = null;

		if (!isAdmin) {
			const scopedProducts = await Product.find(
				{ insertedBy: id },
				{ _id: 0, id: 1 },
			).lean();

			scopedProductIds = scopedProducts.map((product) => product.id);

			scopedOrderQuery = {
				cartItems: {
					$elemMatch: {
						productId: { $in: scopedProductIds },
					},
				},
			};

			const scopedOrders = await Order.find(scopedOrderQuery, {
				_id: 0,
				transactionReference: 1,
				subTotal: 1,
				cartItems: 1,
			}).lean();

			const scopedProductIdSet = new Set(scopedProductIds.map(String));
			allocationByReference = new Map();

			for (const order of scopedOrders) {
				if (!order.transactionReference) continue;

				const scopedSubTotal = (order.cartItems || []).reduce(
					(sum, item) =>
						scopedProductIdSet.has(String(item.productId))
							? sum + item.quantity * item.unitPrice
							: sum,
					0,
				);

				const orderSubTotal = Number(order.subTotal) || 0;
				const allocation =
					orderSubTotal > 0 ? Math.min(scopedSubTotal / orderSubTotal, 1) : 0;

				allocationByReference.set(order.transactionReference, allocation);
			}
		}

		// Trending aggregation is intentionally unchanged.
		const trendingPromise = Cart.aggregate([
			{
				$match: {
					status: { $in: ["unpaid", "paid"] },
				},
			},
			{
				$group: {
					_id: "$productId",
					cartLines: { $sum: 1 },
					unitsAdded: { $sum: "$quantity" },
				},
			},
			{
				$sort: {
					unitsAdded: -1,
					cartLines: -1,
				},
			},
			{
				$limit: 5,
			},
			{
				$lookup: {
					from: Product.collection.name,
					localField: "_id",
					foreignField: "id",
					as: "product",
				},
			},
			{
				$unwind: "$product",
			},
			{
				$facet: {
					product: [
						{
							$project: {
								_id: 0,
								productId: "$_id",
								name: "$product.name",
								cartLines: 1,
								unitsAdded: 1,
							},
						},
					],
					distributor: [
						{
							$group: {
								_id: "$product.insertedBy",
								cartLines: { $sum: "$cartLines" },
								unitsAdded: { $sum: "$unitsAdded" },
							},
						},
						{
							$sort: {
								unitsAdded: -1,
								cartLines: -1,
							},
						},
						{
							$lookup: {
								from: User.collection.name,
								localField: "_id",
								foreignField: "id",
								as: "user",
							},
						},
						{
							$unwind: "$user",
						},
						{
							$project: {
								_id: 0,
								userId: "$_id",
								name: {
									$concat: ["$user.firstName", " ", "$user.lastName"],
								},
								organization: "$user.organization",
								cartLines: 1,
								unitsAdded: 1,
							},
						},
					],
				},
			},
		]);

		const orderScope = scopedOrderQuery;

		const [
			activeCustomers,
			activeDistributors,
			stockSummary,
			fulfilledOrders,
			paidOrders,
			allTimeSales,
			salesGraph,
			trendingResult,
		] = await Promise.all([
			isAdmin
				? Customer.countDocuments({ status: "active" })
				: Promise.resolve(undefined),

			isAdmin
				? User.countDocuments({ type: "distributor", status: "active" })
				: Promise.resolve(undefined),

			Product.aggregate([
				{
					$match: isAdmin
						? { status: "active" }
						: { status: "active", insertedBy: id },
				},
				{
					$group: {
						_id: null,
						activeProducts: { $sum: 1 },
						availableUnits: { $sum: "$stock" },
					},
				},
			]),

			Order.countDocuments({ ...orderScope, status: "fulfilled" }),
			Order.countDocuments({ ...orderScope, status: "paid" }),

			getSuccessfulSales(allocationByReference),
			getSalesGraph(chartConfig, allocationByReference),
			trendingPromise,
		]);

		const stock = stockSummary[0] || {
			activeProducts: 0,
			availableUnits: 0,
		};

		const trending = trendingResult[0] || {
			product: [],
			distributor: [],
		};

		const data = {
			...(isAdmin
				? {
						customers: activeCustomers,
						distributors: activeDistributors,
					}
				: {}),
			stock: {
				activeProducts: stock.activeProducts,
				availableUnits: stock.availableUnits,
			},
			fulfilledOrders,
			paidOrders,
			allTimeSales,
			graph: {
				period: chartConfig.period,
				value: chartConfig.value,
				from: chartConfig.from,
				to: chartConfig.to,
				sales: salesGraph,
			},
			trending: {
				product: trending.product,
				distributor: trending.distributor,
			},
		};

		return res.status(200).json({
			status: "success",
			data,
		});
	} catch (error) {
		console.error("Failed to retrieve system overview:", error);

		return res.status(500).json({
			status: "fail",
			message: "Unable to retrieve the system overview. Please retry.",
		});
	}
};

module.exports = retrieveSystemOverview;

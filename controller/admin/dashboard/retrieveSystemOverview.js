const User = require("../../../model/user");
const { Order } = require("../../../model/order");
const Product = require("../../../model/product");
const Customer = require("../../../model/customer");
const { Cart } = require("../../../model/cart");
const listTransactions = require("../../../util/listTransactions");
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

const getSuccessfulSales = async () => {
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

			transactionCount += 1;
			totalAmount += transaction.amount;
		}
		page += 1;
	}

	return {
		currency: DASHBOARD_CURRENCY,
		transactionCount,
		amount: koboToNaira(totalAmount),
	};
};

const getSalesGraph = async ({ from, to, bucket }) => {
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
			const transactionDate = transaction.paid_at || transaction.created_at;
			const key = getBucketKey(transactionDate, bucket);
			if (salesByBucket.has(key)) {
				salesByBucket.set(key, salesByBucket.get(key) + transaction.amount);
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
	const { period = "day", value = "7" } = req.query ?? {};
	const chartConfig = getChartConfig(period, value);

	if (!chartConfig) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid period or value. Use a supported dashboard filter.",
		});
	}

	try {
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
			Customer.countDocuments({ status: "active" }),
			User.countDocuments({ type: "distributor", status: "active" }),
			Product.aggregate([
				{ $match: { status: "active" } },
				{
					$group: {
						_id: null,
						activeProducts: { $sum: 1 },
						availableUnits: { $sum: "$stock" },
					},
				},
			]),
			Order.countDocuments({ status: "fulfilled" }),
			Order.countDocuments({ status: "paid" }),
			getSuccessfulSales(),
			getSalesGraph(chartConfig),
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

		return res.status(200).json({
			status: "success",
			data: {
				customers: activeCustomers,
				distributors: activeDistributors,
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
			},
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

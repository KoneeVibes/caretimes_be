const { Order } = require("../../../model/order");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const searchOrders = async (req, res) => {
	try {
		const {
			q,
			status,
			minTotal,
			maxTotal,
			from,
			to,
			sortBy = "createdAt",
			order = "desc",
			page = 1,
			limit = 20,
		} = req.query;

		const filters = {};
		if (status) {
			const allowedStatuses = [
				"fulfilled",
				"paid",
				"unfulfilled",
				"cancelled",
				"disputed",
			];
			if (!allowedStatuses.includes(status)) {
				return res.status(400).json({ message: "Invalid order status" });
			}
			filters.status = status;
		}

		if (minTotal !== undefined || maxTotal !== undefined) {
			filters.totalPayable = {};
			if (minTotal !== undefined) {
				const value = Number(minTotal);
				if (!Number.isFinite(value) || value < 0) {
					return res.status(400).json({
						message: "minTotal must be a non-negative number",
					});
				}
				filters.totalPayable.$gte = value;
			}
			if (maxTotal !== undefined) {
				const value = Number(maxTotal);
				if (!Number.isFinite(value) || value < 0) {
					return res.status(400).json({
						message: "maxTotal must be a non-negative number",
					});
				}
				filters.totalPayable.$lte = value;
			}
		}

		if (from !== undefined || to !== undefined) {
			filters.createdAt = {};
			if (from !== undefined) {
				const date = new Date(from);
				if (Number.isNaN(date.getTime())) {
					return res.status(400).json({ message: "Invalid from date" });
				}
				filters.createdAt.$gte = date;
			}
			if (to !== undefined) {
				const date = new Date(to);
				if (Number.isNaN(date.getTime())) {
					return res.status(400).json({ message: "Invalid to date" });
				}
				filters.createdAt.$lte = date;
			}
		}

		const allowedSortFields = [
			"createdAt",
			"updatedAt",
			"totalPayable",
			"subTotal",
			"status",
		];
		const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
		const sortOrder = order === "asc" ? 1 : -1;

		const currentPage = Math.max(parseInt(page, 10) || 1, 1);
		const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
		const skip = (currentPage - 1) * pageSize;

		const pipeline = [];
		if (Object.keys(filters).length > 0) {
			pipeline.push({ $match: filters });
		}

		pipeline.push(
			{
				$lookup: {
					from: "customers",
					localField: "customerId",
					foreignField: "id",
					pipeline: [
						{
							$project: {
								_id: 0,
								id: 1,
								firstName: 1,
								middleName: 1,
								lastName: 1,
								email: 1,
								phone: 1,
								location: 1,
							},
						},
					],
					as: "customer",
				},
			},
			{
				$unwind: {
					path: "$customer",
					preserveNullAndEmptyArrays: true,
				},
			},
		);

		if (q?.trim()) {
			const searchTerm = escapeRegex(q.trim());
			const searchRegex = { $regex: searchTerm, $options: "i" };

			pipeline.push(
				{
					$addFields: {
						_customerSearchName: {
							$trim: {
								input: {
									$concat: [
										{ $ifNull: ["$customer.firstName", ""] },
										" ",
										{ $ifNull: ["$customer.middleName", ""] },
										" ",
										{ $ifNull: ["$customer.lastName", ""] },
									],
								},
							},
						},
						_totalPayableSearch: { $toString: "$totalPayable" },
					},
				},
				{
					$match: {
						$or: [
							{ id: searchRegex },
							{ _customerSearchName: searchRegex },
							{ "customer.location": searchRegex },
							{ transactionAccessCode: searchRegex },
							{ transactionReference: searchRegex },
							{ "cartItems.cartId": searchRegex },
							{ "cartItems.productId": searchRegex },
							{ _totalPayableSearch: searchRegex },
						],
					},
				},
			);
		}

		const [result] = await Order.aggregate([
			...pipeline,
			{
				$facet: {
					orders: [
						{ $sort: { [sortField]: sortOrder } },
						{ $skip: skip },
						{ $limit: pageSize },
						{
							$project: {
								_customerSearchName: 0,
								_totalPayableSearch: 0,
							},
						},
					],
					count: [{ $count: "total" }],
				},
			},
		]);
		const total = result.count[0]?.total ?? 0;

		return res.status(200).json({
			orders: result.orders,
			pagination: {
				total,
				page: currentPage,
				limit: pageSize,
				totalPages: Math.ceil(total / pageSize),
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving order search results at this moment. Please retry",
		});
	}
};

module.exports = searchOrders;

const Product = require("../../../model/product");
const Category = require("../../../model/category");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const searchProducts = async (req, res) => {
	try {
		const {
			q,
			category,
			status,
			minPrice,
			maxPrice,
			inStock,
			sortBy = "createdAt",
			order = "desc",
			page = 1,
			limit = 20,
		} = req.query;
		const filters = {};

		if (category) filters.category = category;

		if (status) {
			const allowedStatuses = ["active", "inactive", "pending", "disabled"];

			if (!allowedStatuses.includes(status)) {
				return res.status(400).json({ message: "Invalid product status" });
			}

			filters.status = status;
		}

		if (minPrice !== undefined || maxPrice !== undefined) {
			filters.price = {};
			if (minPrice !== undefined) {
				const value = Number(minPrice);

				if (!Number.isFinite(value) || value < 0) {
					return res.status(400).json({
						message: "minPrice must be a non-negative number",
					});
				}

				filters.price.$gte = value;
			}
			if (maxPrice !== undefined) {
				const value = Number(maxPrice);
				if (!Number.isFinite(value) || value < 0) {
					return res.status(400).json({
						message: "maxPrice must be a non-negative number",
					});
				}
				filters.price.$lte = value;
			}
		}

		if (inStock === "true") filters.stock = { $gt: 0 };
		if (inStock === "false") filters.stock = 0;

		const allowedSortFields = [
			"name",
			"price",
			"stock",
			"sold",
			"createdAt",
			"updatedAt",
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
					from: Category.collection.name,
					localField: "category",
					foreignField: "id",
					as: "categoryInfo",
				},
			},
			{
				$unwind: {
					path: "$categoryInfo",
					preserveNullAndEmptyArrays: true,
				},
			},
		);

		if (q?.trim()) {
			const searchTerm = new RegExp(escapeRegex(q.trim()), "i");
			pipeline.push({
				$match: {
					$or: [
						{ name: searchTerm },
						{ id: searchTerm },
						{ "categoryInfo.name": searchTerm },
						{ description: searchTerm },
					],
				},
			});
		}

		const [result] = await Product.aggregate([
			...pipeline,
			{
				$facet: {
					data: [
						{ $sort: { [sortField]: sortOrder } },
						{ $skip: skip },
						{ $limit: pageSize },
						{
							$project: {
								_id: 0,
								id: 1,
								name: 1,
								category: { $ifNull: ["$categoryInfo.name", null] },
								stock: 1,
								sold: 1,
								price: 1,
								thumbnail: 1,
								images: 1,
								insertedBy: 1,
								description: 1,
								status: 1,
								createdAt: 1,
								updatedAt: 1,
							},
						},
					],
					count: [{ $count: "total" }],
				},
			},
		]);
		const total = result.count[0]?.total ?? 0;

		return res.status(200).json({
			data: result.data,
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
				"Server encountered an issue in retrieving product search results at this moment. Please retry",
		});
	}
};

module.exports = searchProducts;

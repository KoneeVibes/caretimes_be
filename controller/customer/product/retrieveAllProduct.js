const Product = require("../../../model/product");
const Category = require("../../../model/category");

const retrieveAllProduct = async (req, res) => {
	const {
		page,
		perPage,
		sortBy,
		sortParam,
		categories,
		availability,
		lowerLimit,
		upperLimit,
	} = req.query || {};
	try {
		const filter = { status: "active" };
		if (categories) {
			const categoryArray = categories
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			if (categoryArray.length > 0) {
				const categoryDocs = await Category.find(
					{ name: { $in: categoryArray } },
					{ id: 1 },
				)
					.lean()
					.exec();
				const categoryIds = categoryDocs.map((c) => c.id);
				if (categoryIds.length > 0) {
					filter.category = { $in: categoryIds };
				} else {
					filter.category = { $in: [] };
				}
			}
		}
		if (lowerLimit || upperLimit) {
			filter.price = {};
			if (lowerLimit) filter.price.$gte = Number(lowerLimit);
			if (upperLimit) filter.price.$lte = Number(upperLimit);
		}
		if (availability) {
			const availabilityArray = availability.split(",").filter(Boolean);
			if (
				availabilityArray.includes("In Stock") &&
				!availabilityArray.includes("Out of Stock")
			) {
				filter.stock = { $gt: 0 };
			}
			if (
				availabilityArray.includes("Out of Stock") &&
				!availabilityArray.includes("In Stock")
			) {
				filter.stock = 0;
			}
		}

		const pageNumber = Math.max(Number(page) || 1, 1);
		const limit = Math.max(Number(perPage) || 10, 1);
		const skip = (pageNumber - 1) * limit;
		const total = await Product.countDocuments(filter);

		let query = Product.find(filter, {
			_id: 0,
			id: 1,
			name: 1,
			category: 1,
			stock: 1,
			sold: 1,
			price: 1,
			thumbnail: 1,
			images: 1,
			description: 1,
			status: 1,
		})
			.skip(skip)
			.limit(limit);

		const sort = {};
		if (sortParam === "best-seller") {
			sort.sold = -1;
		}
		if (sortBy) {
			sort.price = sortBy === "Ascending" ? 1 : -1;
		}
		if (Object.keys(sort).length) {
			query = query.sort(sort);
		}

		const products = await query.lean().exec();
		if (!products.length) {
			return res.status(404).json({
				status: "success",
				message: "Products not found",
			});
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: products,
			meta: {
				page: pageNumber,
				perPage: limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving products at this moment. Please retry",
		});
	}
};

module.exports = retrieveAllProduct;

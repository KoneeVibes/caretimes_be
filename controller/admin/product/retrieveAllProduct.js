const Product = require("../../../model/product");

const retrieveAllProduct = async (req, res) => {
	const { filter, page, perPage } = req.query || {};
	try {
		const statusFilter = Array.isArray(filter)
			? { $in: filter }
			: filter || { $in: ["active", "inactive", "pending", "disabled"] };

		const pageNumber = Math.max(Number(page) || 1, 1);
		const limit = Math.max(Number(perPage) || 10, 1);
		const skip = (pageNumber - 1) * limit;
		const total = await Product.countDocuments(statusFilter);

		const products = await Product.find(
			{ status: statusFilter },
			{
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
			},
		)
			.skip(skip)
			.limit(limit)
			.lean()
			.exec();

		if (products.length === 0) {
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

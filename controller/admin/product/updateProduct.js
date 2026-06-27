const Product = require("../../../model/product");
const { v2: cloudinary } = require("cloudinary");
const isValidNumber = require("../../../helper/isValidNumber");
const isValidString = require("../../../helper/isValidString");

const updateProduct = async (req, res) => {
	const { id, type } = req.user;
	const files = req.files || [];
	const { productId } = req.params || {};
	const images = files?.map((attachment) => attachment.path) || [];
	const { name, category, stock, price, status, description } = req.body || {};

	if (![name, status].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid User Type, Cannot Proceed",
		});
	}
	if (![stock, price].every(isValidNumber)) {
		return res.status(400).json({
			status: "fail",
			message: "Stock and price must be numbers or numeric strings",
		});
	}

	try {
		const query = ["super-admin", "admin"].includes(type)
			? { id: productId }
			: { id: productId, insertedBy: id };

		const foundProduct = await Product.findOne(query);
		if (!foundProduct) {
			return res.status(404).json({
				status: "fail",
				message: "Product not found.",
			});
		}
		const oldImages = foundProduct?.images || [];

		const updatedProduct = await Product.findOneAndUpdate(
			query,
			{
				name,
				category: isValidString(category) ? category : null,
				stock: Number(stock),
				price: Number(price),
				images: images,
				description,
				status: ["super-admin", "admin"].includes(type)
					? "active"
					: status.toLowerCase() === "active"
						? "pending"
						: "inactive",
			},
			{ new: true },
		);
		if (!updatedProduct) {
			return res.status(404).json({
				status: "success",
				message: "Product update failed",
			});
		}

		if (oldImages.length) {
			const oldImagesCloudinaryId = oldImages.map(
				(url) => url.split("/").pop().split(".")[0],
			);
			for (const oldImageCloudinaryId of oldImagesCloudinaryId) {
				await cloudinary.uploader.destroy(`product/${oldImageCloudinaryId}`);
			}
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: updatedProduct,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in updating this product. Please retry",
		});
	}
};

module.exports = updateProduct;

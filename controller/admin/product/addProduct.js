const { v4: uuidv4 } = require("uuid");
const Product = require("../../../model/product");
const isValidString = require("../../../helper/isValidString");
const isValidNumber = require("../../../helper/isValidNumber");

const addProduct = async (req, res) => {
	const files = req.files || [];
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
		const product = new Product({
			id: uuidv4(),
			name,
			category: isValidString(category) ? category : null,
			stock: Number(stock),
			price: Number(price),
			images,
			description,
			status: status.toLowerCase() === "active" ? "pending" : "inactive",
		});
		const savedProduct = await product.save();
		if (savedProduct) {
			return res.status(201).json({
				status: "success",
				message: "Product successfully created",
			});
		} else {
			return res.status(500).json({
				status: "fail",
				message:
					"Server encountered an issue saving this product to the db. Please contact support",
			});
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in saving this product. Please retry",
		});
	}
};

module.exports = addProduct;

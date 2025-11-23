const { v4: uuidv4 } = require("uuid");
const Category = require("../../../model/category");
const isValidString = require("../../../helper/isValidString");

const addCategory = async (req, res) => {
	const { name, description, status } = req.body || {};
	if (![name, status].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid Name or Status, Cannot Proceed",
		});
	}
	try {
		const category = new Category({
			id: uuidv4(),
			name,
			description,
			status,
		});
		const savedCategory = await category.save();
		if (savedCategory) {
			return res.status(201).json({
				status: "success",
				message: "Category successfully created",
			});
		} else {
			return res.status(500).json({
				status: "fail",
				message:
					"Server encountered an issue saving this category to the db. Please contact support",
			});
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in saving this category. Please retry",
		});
	}
};

module.exports = addCategory;

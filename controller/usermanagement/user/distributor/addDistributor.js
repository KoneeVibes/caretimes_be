const { v4: uuidv4 } = require("uuid");
const User = require("../../../../model/user");
const isValidString = require("../../../../helper/isValidString");

const addDistributor = async (req, res) => {
	const defaultPIN = "Password@123";
	const { firstName, lastName, email, phone, type } = req.body || {};
	if (!firstName || !lastName || !email || !phone) {
		return res.status(400).json({
			status: "fail",
			message: "Incomplete User Details, Cannot Proceed",
		});
	}
	if (![type].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid User Type, Cannot Proceed",
		});
	}
	try {
		const existingUser = await User.findOne({ email: email });
		if (existingUser) {
			return res.status(409).json({
				status: "fail",
				message: "User with this email already exists.",
			});
		}
		const user = new User({
			id: uuidv4(),
			firstName,
			lastName,
			email,
			phone,
			type,
			password: defaultPIN,
		});
		const savedUser = await user.save();
		if (savedUser) {
			return res.status(201).json({
				status: "success",
				message: "User successfully created",
			});
		} else {
			return res.status(500).json({
				status: "fail",
				message:
					"Server encountered an issue saving this user to the db. Please contact support",
			});
		}
	} catch (error) {
		console.error(err);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in adding this admin user. Please retry",
		});
	}
};

module.exports = addDistributor;

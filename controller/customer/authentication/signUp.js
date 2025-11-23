const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const Customer = require("../../../model/customer");

const signUpUser = async (req, res) => {
	const { email, password, location } = req.body || {};

	if (!email || !password) {
		return res.status(400).json({
			status: "fail",
			message: "Incomplete user details. Cannot proceed.",
		});
	}

	try {
		const existingUser = await Customer.findOne({ email });
		if (existingUser) {
			return res.status(409).json({
				status: "fail",
				message: "A user with this email already exists.",
			});
		}

		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		const userId = uuidv4();
		const customer = new Customer({
			id: userId,
			email,
			location,
			password: hashedPassword,
		});
		await customer.save();
		return res.status(201).json({
			status: "success",
			message: "User created and OTP sent successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an error while creating the user. Please retry.",
		});
	}
};

module.exports = signUpUser;

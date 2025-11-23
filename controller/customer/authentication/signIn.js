const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Customer = require("../../../model/customer");

const signInCustomer = async (req, res) => {
	const { email, password } = req.body || {};
	if (!email || !password) {
		return res.status(400).json({
			status: "fail",
			message: "Incomplete complete details, cannot proceed",
		});
	}
	try {
		const customer = await Customer.findOne({ email: email, status: "active" });
		if (customer) {
			const isMatch = await bcrypt.compare(password, customer.password);
			if (isMatch) {
				const accessToken = jwt.sign(
					{
						id: customer._id,
					},
					process.env.JWT_SECRET_KEY,
					{ expiresIn: `${1440}m` }
				);
				return res.status(200).json({
					status: "success",
					token: accessToken,
				});
			} else {
				return res.status(401).json({
					status: "fail",
					message: "Incorrect password",
				});
			}
		} else {
			return res.status(404).json({
				status: "fail",
				message: "Customer not found",
			});
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in authenticating this customer. Please retry",
		});
	}
};

module.exports = signInCustomer;

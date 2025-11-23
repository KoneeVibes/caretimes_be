const bcrypt = require("bcrypt");
const Customer = require("../../../model/customer");
const authVerificationOtp = require("../../../model/authVerificationOTP");

const resetCustomerPassword = async (req, res) => {
	const { email, newPassword, confirmNewPassword } = req.body || {};

	// check for complete payload
	if (!email?.trim() || !newPassword?.trim() || !confirmNewPassword?.trim()) {
		return res.status(400).json({
			status: "error",
			message: "All fields are required",
		});
	}

	// Validation for password match
	if (newPassword !== confirmNewPassword) {
		return res.status(400).json({
			status: "fail",
			message: "Passwords do not match",
		});
	}

	try {
		const normalizedEmail = email.toLowerCase().trim();
		const existingCustomer = await Customer.findOne({
			email: normalizedEmail,
			status: "active",
		});
		if (!existingCustomer) {
			return res.status(404).json({
				status: "fail",
				message: "No account found with this email",
			});
		}

		const verificationOTP = await authVerificationOtp.findOne({
			requester: normalizedEmail,
			isUsed: true,
		});
		if (!verificationOTP) {
			return res.status(404).json({
				status: "fail",
				message: "Time out. Please request new OTP and try again.",
			});
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		const updatedCustomer = await Customer.updateOne(
			{ email: normalizedEmail },
			{ password: hashedPassword },
			{ new: true }
		);
		if (!updatedCustomer) {
			return res.status(500).json({
				status: "fail",
				message: "Failed to reset password. Please try again.",
			});
		}

		return res.status(200).json({
			status: "success",
			message: "Password successfully updated. Proceed to login.",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in resetting user password. Please retry",
		});
	}
};

module.exports = resetCustomerPassword;

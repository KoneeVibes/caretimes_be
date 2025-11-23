const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const User = require("../../../model/user");
const sendOTPEmail = require("../../../util/emailOTPSender");
const AuthVerificationOtp = require("../../../model/authVerificationOTP");

const forgotPassword = async (req, res) => {
	const { email } = req.body || {};
	if (!email) {
		return res.status(400).json({
			status: "fail",
			message: "User email not found, cannot proceed",
		});
	}
	try {
		// check for existing user.
		const existingUser = await User.findOne({ email: email });
		if (!existingUser) {
			return res.status(409).json({
				status: "fail",
				message: "Invalid email, please retry",
			});
		}

		const randomFourDigits = crypto.randomInt(1000, 10000).toString();
		const hashedOTP = await bcrypt.hash(randomFourDigits, 10);
		const otp = new AuthVerificationOtp({
			id: uuidv4(),
			requester: email.toLowerCase().trim(),
			otp: hashedOTP,
			client: "admin",
		});

		await otp.save();
		await sendOTPEmail(
			email,
			randomFourDigits,
			"Reset Password",
			"Password Reset"
		);

		return res.status(201).json({
			status: "success",
			message: "Password reset OTP sent successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in sending OTP to this user. Please retry",
		});
	}
};

module.exports = forgotPassword;

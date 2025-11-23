const bcrypt = require("bcrypt");
const AuthVerificationOTP = require("../../../model/authVerificationOTP");

const verifyAuthOTP = async (req, res) => {
	const { email, otp } = req.body;
	if (!email?.trim() || !otp?.trim()) {
		return res.status(400).json({
			status: "fail",
			message: "Email and OTP are required",
		});
	}

	const normalizedEmail = email.trim().toLowerCase();
	try {
		const verificationOTP = await AuthVerificationOTP.findOneAndUpdate(
			{ requester: normalizedEmail, client: "customer", isUsed: false },
			{ isUsed: true },
			{ new: true }
		).sort({ createdAt: -1 });

		if (!verificationOTP) {
			return res.status(404).json({
				status: "fail",
				message: "Invalid or expired OTP. Please request a new one.",
			});
		}

		const isMatch = await bcrypt.compare(otp, verificationOTP.otp);
		if (!isMatch) {
			return res.status(400).json({
				status: "fail",
				message: "Invalid OTP. Please try again.",
			});
		}

		return res.status(200).json({
			status: "success",
			message: "Auth OTP verified successfully. Proceed to set new password.",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in verifying auth OTP. Please try again later.",
		});
	}
};

module.exports = verifyAuthOTP;

const bcrypt = require("bcrypt");
const AuthVerificationOTP = require("../../../model/authVerificationOTP");

const verifyOTP = async (req, res) => {
	const { requester, submittedOTP } = req.body;

	if (!requester?.trim() || !submittedOTP?.trim()) {
		return res.status(400).json({
			status: "fail",
			message: "Email and OTP are required",
		});
	}

	const normalizedEmail = requester.trim().toLowerCase();
	try {
		const verificationOTP = await AuthVerificationOTP.findOneAndUpdate(
			{ requester: normalizedEmail, client: "admin", isUsed: false },
			{ isUsed: true },
			{ new: true }
		).sort({ createdAt: -1 });

		if (!verificationOTP) {
			return res.status(404).json({
				status: "fail",
				message: "Invalid or expired OTP. Please request a new one.",
			});
		}

		const isMatch = await bcrypt.compare(submittedOTP, verificationOTP.otp);
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

module.exports = verifyOTP;

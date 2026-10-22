const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const Customer = require("../../../model/customer");
const AuthVerificationOtp = require("../../../model/authVerificationOTP");
const {
	default: sendEmail,
} = require("../../../util/notification/resend/emailSender");
const {
	resetPasswordOTPNotificationTemplate,
} = require("../../../view/authentication/resetPasswordOTPNotification");

const forgotPassword = async (req, res) => {
	const { email } = req.body || {};
	if (!email) {
		return res.status(400).json({
			status: "fail",
			message: "User email not found, cannot proceed",
		});
	}
	try {
		// check for existing customer.
		const existingCustomer = await Customer.findOne({ email });
		if (!existingCustomer) {
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
			client: "customer",
		});

		await otp.save();
		const templateConfig = {
			randomFourDigits,
			title: "Reset Password",
		};
		const html = resetPasswordOTPNotificationTemplate(templateConfig);
		const mailConfig = {
			email,
			html,
			subject: `Reset Password OTP`,
		};
		await sendEmail(mailConfig);

		return res.status(201).json({
			status: "success",
			message: "Password reset OTP sent successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in sending OTP to this customer. Please retry",
		});
	}
};

module.exports = forgotPassword;

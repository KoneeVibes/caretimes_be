const bcrypt = require("bcrypt");
const User = require("../../model/user");
const authVerificationOtp = require("../../model/authVerificationOTP");

const resetPassword = async (req, res) => {
    const { email, password, confirmPassword } = req.body || {};

    // check for complete payload
    if (!email?.trim() || !password?.trim() || !confirmPassword?.trim()) {
        return res.status(400).json({
            status: "error",
            message: "All fields are required"
        });
    };

    // Validation for password match
    if (password !== confirmPassword) {
        return res.status(400).json({
            status: "fail",
            message: "Passwords do not match"
        });
    };

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail, status: "active" });
        if (!existingUser) {
            return res.status(404).json({
                status: "fail",
                message: "No account found with this email"
            });
        };

        const verificationOTP = await authVerificationOtp.findOne({ requester: normalizedEmail, isUsed: true });
        if (!verificationOTP) {
            return res.status(404).json({
                status: "fail",
                message: "Time out. Please request new OTP and try again."
            });
        };

        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await User.updateOne(
            { email: normalizedEmail },
            { password: hashedPassword },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(500).json({
                status: "fail",
                message: "Failed to reset password. Please try again."
            });
        };

        return res.status(200).json({
            status: "success",
            message: "Password successfully updated. Proceed to login."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "fail",
            message: "Server encountered an issue in resetting user password. Please retry"
        });
    }
};

module.exports = resetPassword;

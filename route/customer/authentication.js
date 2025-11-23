const express = require("express");
const router = express.Router();
const {
	signOutUser,
} = require("../../controller/customer/authentication/signOut");

router.post(
	"/sign-up",
	require("../../controller/customer/authentication/signUp")
);
router.post(
	"/sign-in",
	require("../../controller/customer/authentication/signIn")
);
router.post(
	"/forgot-password",
	require("../../controller/customer/authentication/forgotPassword")
);
router.post(
	"/verify-otp",
	require("../../controller/customer/authentication/otpVerification")
);
router.patch(
	"/reset-password",
	require("../../controller/customer/authentication/resetPassword")
);
router.post(
	"/sign-out",
	require("../../middleware/authorization"),
	signOutUser
);

module.exports = router;

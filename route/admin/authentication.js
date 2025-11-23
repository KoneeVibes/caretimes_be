const express = require("express");
const router = express.Router();
const {
	signOutUser,
} = require("../../controller/admin/authentication/signOut");

router.post(
	"/sign-in",
	require("../../controller/admin/authentication/signIn")
);
router.post(
	"/forgot-password",
	require("../../controller/admin/authentication/forgotPassword")
);
router.post(
	"/verify-otp",
	require("../../controller/admin/authentication/verifyOTP")
);
router.patch(
	"/reset-password",
	require("../../controller/admin/authentication/resetPassword")
);
router.post(
	"/sign-out",
	require("../../middleware/authorization"),
	signOutUser
);

module.exports = router;

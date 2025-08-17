const express = require("express");
const router = express.Router();
const { signOutUser } = require("../controller/authentication/signOut");

router.post("/sign-in", require("../controller/authentication/signIn"));
router.post("/forgot-password", require("../controller/authentication/forgotPassword"));
router.post("/verify-otp", require("../controller/authentication/verifyOTP"));
router.patch("/reset-password", require("../controller/authentication/resetPassword"));
router.post("/sign-out", require("../middleware/authorization"), signOutUser);

module.exports = router;

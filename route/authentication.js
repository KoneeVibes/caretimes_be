const express = require("express");
const router = express.Router();

router.post("/sign-in", require("../controller/authentication/signIn"));
router.post("/forgot-password", require("../controller/authentication/forgotPassword"));
router.post("/verify-otp", require("../controller/authentication/verifyOTP"));
router.patch("/reset-password", require("../controller/authentication/resetPassword"));

module.exports = router;

const express = require("express");
const router = express.Router();

router.post("/paystack", require("../../controller/webhook/provider/paystack"));

module.exports = router;

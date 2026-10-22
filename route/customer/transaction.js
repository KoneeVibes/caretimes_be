const express = require("express");
const router = express.Router();

router.get(
	"/single/download/:transactionId",
	require("../../controller/customer/transaction/downloadTransactionReceipt"),
);

module.exports = router;

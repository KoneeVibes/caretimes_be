const express = require("express");
const router = express.Router();
const isPermitted = require("../../middleware/permission");
const resource = "Transactions";

router.get(
	"/single/download/:transactionId",
	isPermitted(resource),
	require("../../controller/admin/transaction/downloadTransactionReceipt"),
);

router.get(
	"/overview",
	isPermitted(resource),
	require("../../controller/admin/transaction/retrieveTransactionOverview"),
);

router.get(
	"/all",
	isPermitted(resource),
	require("../../controller/admin/transaction/retrieveAllTransaction"),
);

module.exports = router;

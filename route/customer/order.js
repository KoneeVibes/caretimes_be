const express = require("express");
const router = express.Router();

router.get(
	"/single/:orderId",
	require("../../controller/customer/order/retrieveOrderById"),
);

router.get("/all", require("../../controller/customer/order/retrieveAllOrder"));

module.exports = router;

const express = require("express");
const router = express.Router();
const isPermitted = require("../../middleware/permission");
const resource = "Orders";

router.get(
	"/single/:orderId",
	isPermitted(resource),
	require("../../controller/admin/order/retrieveOrderById"),
);

router.get(
	"/all",
	isPermitted(resource),
	require("../../controller/admin/order/retrieveAllOrder"),
);

module.exports = router;

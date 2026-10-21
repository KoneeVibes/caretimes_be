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
	"/overview",
	isPermitted(resource),
	require("../../controller/admin/order/retrieveOrderOverview"),
);

router.get(
	"/all",
	isPermitted(resource),
	require("../../controller/admin/order/retrieveAllOrder"),
);

router.patch(
	"/:orderId/cancel-order",
	isPermitted(resource),
	require("../../controller/admin/order/cancelOrder"),
);

router.patch(
	"/:orderId/fulfill-order",
	isPermitted(resource),
	require("../../controller/admin/order/fulfillOrder"),
);

router.patch(
	"/:orderId/dispute-order",
	isPermitted(resource),
	require("../../controller/admin/order/disputeOrder"),
);

module.exports = router;

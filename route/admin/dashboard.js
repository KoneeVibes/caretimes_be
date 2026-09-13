const express = require("express");
const router = express.Router();
const isPermitted = require("../../middleware/permission");
const resource = "Dashboard";

router.get(
	"/overview",
	isPermitted(resource),
	require("../../controller/admin/dashboard/retrieveSystemOverview"),
);

module.exports = router;

const express = require("express");
const router = express.Router();

router.get(
	"/single/:categoryId",
	require("../../controller/customer/category/retrieveCategoryById")
);

router.get(
	"/all",
	require("../../controller/customer/category/retrieveAllCategory")
);

module.exports = router;

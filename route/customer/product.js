const express = require("express");
const router = express.Router();

router.get(
	"/search",
	require("../../controller/customer/product/searchProduct"),
);

router.get(
	"/single/:productId",
	require("../../controller/customer/product/retrieveProductById"),
);

router.get(
	"/all",
	require("../../controller/customer/product/retrieveAllProduct"),
);

module.exports = router;

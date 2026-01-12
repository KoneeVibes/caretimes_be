const express = require("express");
const router = express.Router();

router.get(
	"/single/:productId",
	require("../../controller/customer/cart/retrieveProductById")
);

router.get(
	"/all",
	require("../../controller/customer/cart/retrieveAllProduct")
);

router.post(
	"/add-product",
	require("../../controller/customer/cart/addProductToCart")
);

router.patch(
	"/:productId/update-product",
	require("../../controller/customer/cart/updateProductInCart")
);

router.delete(
	"/single/:productId",
	require("../../controller/customer/cart/removeProductFromCart")
);

module.exports = router;

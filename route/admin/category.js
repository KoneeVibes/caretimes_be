const express = require("express");
const router = express.Router();

router.get(
	"/single/:categoryId",
	require("../../controller/admin/category/retrieveCategoryById")
);

router.get(
	"/all",
	require("../../controller/admin/category/retrieveAllCategory")
);

router.post(
	"/add-category",
	require("../../controller/admin/category/addCategory")
);

router.patch(
	"/:categoryId/update-category",
	require("../../controller/admin/category/updateCategory")
);

router.delete(
	"/single/:categoryId",
	require("../../controller/admin/category/deleteCategory")
);

module.exports = router;

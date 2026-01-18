const express = require("express");
const router = express.Router();
const isPermitted = require("../../middleware/permission");
const fileUpload = require("../../middleware/fileUpload");
const resource = "Inventory";

const options = {
	getFolderName: (req, file) => "category",
	fieldName: "thumbnail",
	fileFilter: (req, file, cb) => {
		const allowedTypes = ["image/jpeg", "image/png"];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Only JPEG and PNG files are allowed!"), false);
		}
	},
};

router.get(
	"/single/:categoryId",
	isPermitted(resource),
	require("../../controller/admin/category/retrieveCategoryById")
);

router.get(
	"/all",
	isPermitted(resource),
	require("../../controller/admin/category/retrieveAllCategory")
);

router.get(
	"/overview",
	isPermitted(resource),
	require("../../controller/admin/category/retrieveCategoryOverview")
);

router.post(
	"/add-category",
	isPermitted(resource),
	fileUpload(options),
	require("../../controller/admin/category/addCategory")
);

router.patch(
	"/:categoryId/update-category",
	isPermitted(resource),
	fileUpload(options),
	require("../../controller/admin/category/updateCategory")
);

router.delete(
	"/single/:categoryId",
	isPermitted(resource),
	require("../../controller/admin/category/deleteCategory")
);

module.exports = router;

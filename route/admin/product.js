const express = require("express");
const router = express.Router();
const fileUpload = require("../../middleware/fileUpload");
const isPermitted = require("../../middleware/permission");
const resource = "Inventory";

const options = {
	getFolderName: (req, file) => "product",
	fieldName: "image",
	isMultiple: true,
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
	"/single/:productId",
	isPermitted(resource),
	require("../../controller/admin/product/retrieveProductById")
);

router.get(
	"/all",
	isPermitted(resource),
	require("../../controller/admin/product/retrieveAllProduct")
);

router.post(
	"/add-product",
	isPermitted(resource),
	fileUpload(options),
	require("../../controller/admin/product/addProduct")
);

router.patch(
	"/:productId/update-product",
	isPermitted(resource),
	fileUpload(options),
	require("../../controller/admin/product/updateProduct")
);

router.delete(
	"/single/:productId",
	isPermitted(resource),
	require("../../controller/admin/product/deleteProduct")
);

module.exports = router;

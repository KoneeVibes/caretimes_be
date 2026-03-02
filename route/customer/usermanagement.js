const express = require("express");
const router = express.Router();
const fileUpload = require("../../middleware/fileUpload");

const options = {
	getFolderName: (req, file) => "customer",
	fieldName: "avatar",
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
	"/logged-in-user",
	require("../../controller/customer/usermanagement/retrieveLoggedInUser"),
);

router.patch(
	"/update-profile",
	fileUpload(options),
	require("../../controller/customer/usermanagement/updateProfile"),
);

module.exports = router;

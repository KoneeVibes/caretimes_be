const express = require("express");
const router = express.Router();
const isPermitted = require("../../middleware/permission");
const resource = "Admin Management";

router.get(
	"/logged-in-user",
	require("../../controller/admin/usermanagement/user/retrieveLoggedInUser")
);

router.post(
	"/admin/add-user",
	isPermitted(resource),
	require("../../controller/admin/usermanagement/user/admin/addAdmin")
);

router.post(
	"/distributor/add-user",
	isPermitted(resource),
	require("../../controller/admin/usermanagement/user/distributor/addDistributor")
);

router.get(
	"/all/user",
	isPermitted(resource),
	require("../../controller/admin/usermanagement/user/retrieveAllUserByType")
);

router.get(
	"/single/user/:userId",
	isPermitted(resource),
	require("../../controller/admin/usermanagement/user/retrieveUserById")
);

router.patch(
	"/user/:userId/update-admin",
	isPermitted(resource),
	require("../../controller/admin/usermanagement/user/admin/updateAdmin")
);

router.patch(
	"/user/:userId/activate-user",
	isPermitted(resource),
	require("../../controller/admin/usermanagement/user/activateUser")
);

router.delete(
	"/user/:userId",
	isPermitted(resource),
	require("../../controller/admin/usermanagement/user/deleteUser")
);

router.get(
	"/access-control/:userId",
	require("../../controller/admin/usermanagement/accesscontrol/retrievePermissions")
);

router.patch(
	"/access-control/:userId/manage-permissions",
	isPermitted(resource),
	require("../../controller/admin/usermanagement/accesscontrol/managePermissions")
);

module.exports = router;

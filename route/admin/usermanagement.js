const express = require("express");
const router = express.Router();

router.get(
	"/logged-in-user",
	require("../../controller/admin/usermanagement/user/retrieveLoggedInUser")
);

router.post(
	"/admin/add-user",
	require("../../controller/admin/usermanagement/user/admin/addAdmin")
);

router.post(
	"/distributor/add-user",
	require("../../controller/admin/usermanagement/user/distributor/addDistributor")
);

router.get(
	"/all/user",
	require("../../controller/admin/usermanagement/user/retrieveAllUserByType")
);

router.get(
	"/single/user/:userId",
	require("../../controller/admin/usermanagement/user/retrieveUserById")
);

router.patch(
	"/user/:userId/update-admin",
	require("../../controller/admin/usermanagement/user/admin/updateAdmin")
);

router.patch(
	"/user/:userId/activate-user",
	require("../../controller/admin/usermanagement/user/activateUser")
);

router.delete(
	"/user/:userId",
	require("../../controller/admin/usermanagement/user/deleteUser")
);

module.exports = router;

const express = require("express");
const router = express.Router();

router.get(
	"/logged-in-user",
	require("../controller/usermanagement/user/retrieveLoggedInUser")
);

router.post(
	"/admin/add-user",
	require("../controller/usermanagement/user/admin/addAdmin")
);

router.post(
	"/distributor/add-user",
	require("../controller/usermanagement/user/distributor/addDistributor")
);

router.get(
	"/all/user",
	require("../controller/usermanagement/user/retrieveAllUserByType")
);

router.get(
	"/user/:userId",
	require("../controller/usermanagement/user/retrieveUserById")
);

router.patch(
	"/user/:userId/update-admin",
	require("../controller/usermanagement/user/admin/updateAdmin")
);

router.patch(
	"/user/:userId/activate-user",
	require("../controller/usermanagement/user/activateUser")
);

router.delete(
	"/user/:userId",
	require("../controller/usermanagement/user/deleteUser")
);

module.exports = router;

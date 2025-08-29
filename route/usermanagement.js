const express = require("express");
const router = express.Router();

router.get(
	"/logged-in-user",
	require("../controller/usermanagement/user/retrieveLoggedInUser")
);

module.exports = router;

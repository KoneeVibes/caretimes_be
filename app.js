const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOption");
const cookieParser = require("cookie-parser");

// middleware
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", req.headers.origin);
	res.header("Access-Control-Allow-Credentials", "true");
	res.header(
		"Access-Control-Allow-Methods",
		"GET,POST,PUT,PATCH,DELETE,OPTIONS"
	);
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	next();
});
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// admin-interface:
app.use(
	"/api/v1/admin-interface/auth",
	require("./route/admin/authentication")
);
app.use(
	"/api/v1/admin-interface/user-management",
	require("./middleware/authorization"),
	require("./route/admin/usermanagement")
);
app.use(
	"/api/v1/admin-interface/category",
	require("./middleware/authorization"),
	require("./route/admin/category")
);
app.use(
	"/api/v1/admin-interface/product",
	require("./middleware/authorization"),
	require("./route/admin/product")
);

// customer-interface:
app.use(
	"/api/v1/customer-interface/auth",
	require("./route/customer/authentication")
);
app.use(
	"/api/v1/customer-interface/category",
	require("./route/customer/category")
);
app.use(
	"/api/v1/customer-interface/product",
	require("./route/customer/product")
);

module.exports = app;

const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Customer = require("../model/customer");
const {
	adminTokenBlacklist,
} = require("../controller/admin/authentication/signOut");
const {
	customerTokenBlacklist,
} = require("../controller/customer/authentication/signOut");
require("dotenv").config();

module.exports = async (req, res, next) => {
	if (req.method === "OPTIONS") {
		return next();
	}
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader)
			return res.status(401).json({
				status: "fail",
				message: "Authorization header missing",
			});
		const token = authHeader.split(" ")[1];
		if (!token)
			return res.status(404).json({
				status: "fail",
				message: "Token is missing in authorization header",
			});
		if (adminTokenBlacklist.has(token) || customerTokenBlacklist.has(token))
			return res.status(401).json({
				status: "fail",
				message: "Token is blacklisted",
			});
		let decodedToken;
		try {
			decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
		} catch (err) {
			return res.status(401).json({
				status: "fail",
				message: "Invalid or expired token",
			});
		}
		let account = null;

		if (req.baseUrl.startsWith("/api/v1/admin-interface")) {
			account = await User.findById(decodedToken.id);
		} else if (req.baseUrl.startsWith("/api/v1/customer-interface")) {
			account = await Customer.findById(decodedToken.id);
		} else {
			return res.status(400).json({
				status: "fail",
				message: "Invalid route context — interface not recognized",
			});
		}
		if (!account) {
			return res.status(404).json({
				status: "fail",
				message: "Account not found",
			});
		}
		req.user = account;
		next();
	} catch (err) {
		return res.status(500).json({
			status: "fail",
			message: "Server encountered an error. Contact Administrator",
		});
	}
};

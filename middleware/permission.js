const AccessControl = require("../model/accessControl");
const systemModules = require("../config/systemModules");

const grantUserPermission = (module) => {
	return async (req, res, next) => {
		try {
			const { id, type } = req.user;
			const systemModule = systemModules.find((m) => m.name === module);
			if (!systemModule) {
				return res.status(400).json({
					status: "fail",
					message: `Module '${module}' is not registered in the system.`,
				});
			}
			if (!systemModule.userType.includes(type)) {
				return res.status(403).json({
					status: "fail",
					message: `Role '${type}' not authorized for module: ${module}`,
				});
			}
			const accessControl = await AccessControl.findOne({ id });
			if (!accessControl) {
				return res.status(404).json({
					status: "fail",
					message: "Access control not found",
				});
			}
			const permission = accessControl.permissions.find(
				(p) => p.module === module
			);
			if (!permission || permission.status !== "active") {
				return res.status(403).json({
					status: "fail",
					message: `Permission denied for module: ${module}`,
				});
			}
			next();
		} catch (error) {
			console.error("Authorization error:", error);
			return res.status(500).json({
				status: "fail",
				message: "Server error during authorization.",
			});
		}
	};
};

module.exports = grantUserPermission;

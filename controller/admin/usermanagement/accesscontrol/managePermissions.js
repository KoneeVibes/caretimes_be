const User = require("../../../../model/user");
const AccessControl = require("../../../../model/accessControl");

const managePermissions = async (req, res) => {
	const { userId } = req.params || {};
	const { permissions } = req.body || {};
	if (!Array.isArray(permissions) || permissions.length === 0) {
		return res.status(400).json({
			status: "fail",
			message: "Permissions must be a non-empty array",
		});
	}
	try {
		const user = await User.findOne({
			id: userId,
			status: "active",
		}).lean();
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "User not found",
			});
		}
		let accessControl = await AccessControl.findOne({ id: userId });
		if (!accessControl) {
			accessControl = await AccessControl.create({
				id: userId,
				status: "active",
			});
		}
		accessControl.permissions = permissions;
		await accessControl.save();
		res.status(200).json({
			status: "success",
			message: "Permissions updated successfully",
			data: accessControl,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue while updating permissions. Please retry",
		});
	}
};

module.exports = managePermissions;

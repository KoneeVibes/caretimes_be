const AccessControl = require("../../../../model/accessControl");

const retrieveUserPermissions = async (req, res) => {
	const { userId } = req.params || {};
	if (!userId) {
		return res.status(400).json({
			status: "fail",
			message: "User Id not found, Cannot Proceed",
		});
	}
	try {
		const accessControl = await AccessControl.findOne({ id: userId }).lean();
		if (!accessControl) {
			return res.status(404).json({
				status: "success",
				message: "Access Control not found",
			});
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: accessControl.permissions,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving access control at this moment. Please retry",
		});
	}
};

module.exports = retrieveUserPermissions;

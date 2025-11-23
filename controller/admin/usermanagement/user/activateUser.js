const User = require("../../../../model/user");

const activateUser = async (req, res) => {
	const { userId } = req.params || {};
	if (!userId) {
		return res.status(400).json({
			status: "fail",
			message: "User Id not found, Cannot Proceed",
		});
	}
	try {
		const updatedUser = await User.findOneAndUpdate(
			{ id: userId },
			{ status: "active" },
			{ new: true }
		);
		if (!updatedUser) {
			return res.status(404).json({
				status: "success",
				message: "User not found",
			});
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: updatedUser,
		});
	} catch (error) {
		console.error(err);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in activating this user. Please retry",
		});
	}
};

module.exports = activateUser;

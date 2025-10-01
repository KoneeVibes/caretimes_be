const User = require("../../../model/user");

const retrieveUserById = async (req, res) => {
	const { userId } = req.params || {};
	if (!userId) {
		return res.status(400).json({
			status: "fail",
			message: "User Id not found, Cannot Proceed",
		});
	}
	try {
		const user = await User.findOne(
			{ id: userId },
			{
				_id: 0,
				id: 1,
				firstName: 1,
				middleName: 1,
				avatar: 1,
				lastName: 1,
				email: 1,
				phone: 1,
				organization: 1,
				role: 1,
				type: 1,
				status: 1,
				passwordChanged: 1,
				createdAt: 1,
			}
		);
		if (!user) {
			return res.status(404).json({
				status: "success",
				message: "User not found",
			});
		}
		res.status(200).json({
			status: "success",
			message: "success",
			data: user,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving user at this moment. Please retry",
		});
	}
};

module.exports = retrieveUserById;

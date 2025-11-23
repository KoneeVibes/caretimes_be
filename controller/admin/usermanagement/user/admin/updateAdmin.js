const User = require("../../../../../model/user");
const isValidString = require("../../../../../helper/isValidString");

const updateAdmin = async (req, res) => {
	const { userId } = req.params || {};
	const { firstName, lastName, email, phone, type } = req.body || {};
	if (!firstName || !lastName || !email || !phone) {
		return res.status(400).json({
			status: "fail",
			message: "Incomplete User Details, Cannot Proceed",
		});
	}
	if (![type].every(isValidString)) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid User Type, Cannot Proceed",
		});
	}
	try {
		const updatedUser = await User.findOneAndUpdate(
			{
				id: userId,
				type: { $in: ["super-admin", "admin", "distributor"] },
				status: "active",
			},
			{
				firstName,
				lastName,
				email,
				phone,
				type,
			},
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
				"Server encountered an issue in updating this admin user. Please retry",
		});
	}
};

module.exports = updateAdmin;

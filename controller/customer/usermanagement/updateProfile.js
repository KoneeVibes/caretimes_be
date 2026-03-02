const { v2: cloudinary } = require("cloudinary");
const Customer = require("../../../model/customer");
const isValidString = require("../../../helper/isValidString");

const updateUserProfile = async (req, res) => {
	const updatePayload = {};

	const { id } = req.user || {};
	const { path } = req.file || {};
	const {
		firstName,
		lastName,
		email,
		phone,
		state,
		street,
		landmark,
		houseNumber,
	} = req.body || {};

	if (isValidString(path)) updatePayload.avatar = path.trim();
	if (isValidString(firstName)) updatePayload.firstName = firstName.trim();
	if (isValidString(lastName)) updatePayload.lastName = lastName.trim();
	if (isValidString(email)) updatePayload.email = email.trim();
	if (isValidString(phone)) updatePayload.phone = phone.trim();
	if (isValidString(state)) updatePayload.location = state.trim();
	if (isValidString(street)) updatePayload.street = street.trim();
	if (isValidString(landmark)) updatePayload.landmark = landmark.trim();
	if (isValidString(houseNumber))
		updatePayload.houseNumber = houseNumber.trim();

	if (Object.keys(updatePayload).length === 0) {
		return res.status(400).json({
			status: "fail",
			message: "No valid fields provided for update",
		});
	}
	try {
		const foundCustomer = await Customer.findOne({ id, status: "active" });
		if (!foundCustomer) {
			return res.status(404).json({
				status: "fail",
				message: "Customer not found.",
			});
		}
		const oldAvatar = foundCustomer?.avatar;

		const updatedCustomer = await Customer.findOneAndUpdate(
			{
				id,
				status: "active",
			},
			{ $set: updatePayload },
			{ new: true },
		);
		if (!updatedCustomer) {
			return res.status(404).json({
				status: "success",
				message: "Customer not found",
			});
		}

		if (path && oldAvatar) {
			const oldAvatarId = oldAvatar.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(`customer/${oldAvatarId}`);
		}

		res.status(200).json({
			status: "success",
			message: "success",
			data: updatedCustomer,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in updating this user profile at this moment. Please retry",
		});
	}
};

module.exports = updateUserProfile;

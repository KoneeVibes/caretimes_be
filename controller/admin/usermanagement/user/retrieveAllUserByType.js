const User = require("../../../../model/user");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const retrieveAllUserByType = async (req, res) => {
	const { admin, distributor, page, perPage, q } = req.query || {};

	try {
		const userTypes = [];
		if (admin === "true") userTypes.push("admin");
		if (distributor === "true") userTypes.push("distributor");

		const query = userTypes.length > 0 ? { type: { $in: userTypes } } : {};
		const searchTerm = typeof q === "string" ? q.trim() : "";

		if (searchTerm) {
			const searchRegex = new RegExp(escapeRegex(searchTerm), "i");
			query.$or = [
				{ firstName: searchRegex },
				{ middleName: searchRegex },
				{ lastName: searchRegex },
				{ email: searchRegex },
				{ type: searchRegex },
				{ status: searchRegex },
				{ organization: searchRegex },
			];
		}

		const pageNumber = Math.max(Number(page) || 1, 1);
		const limit = Math.max(Number(perPage) || 10, 1);
		const skip = (pageNumber - 1) * limit;

		const total = await User.countDocuments(query);

		const users = await User.find(query, {
			_id: 0,
			id: 1,
			firstName: 1,
			middleName: 1,
			avatar: 1,
			bio: 1,
			lastName: 1,
			email: 1,
			phone: 1,
			organization: 1,
			role: 1,
			type: 1,
			status: 1,
			passwordChanged: 1,
			createdAt: 1,
		})
			.skip(skip)
			.limit(limit)
			.lean()
			.exec();

		if (users.length === 0) {
			return res.status(404).json({
				status: "success",
				message: "Users not found",
			});
		}

		return res.status(200).json({
			status: "success",
			message: "success",
			data: users,
			meta: {
				page: pageNumber,
				perPage: limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving users at this moment. Please retry",
		});
	}
};

module.exports = retrieveAllUserByType;

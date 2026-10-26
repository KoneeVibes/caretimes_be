const User = require("../../../../model/user");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const searchUsers = async (req, res) => {
	try {
		const {
			q,
			type,
			status,
			sortBy = "createdAt",
			order = "desc",
			page = 1,
			limit = 20,
		} = req.query;

		const filters = {
			type: { $ne: "super-admin" },
		};

		if (type) {
			const allowedTypes = ["admin", "distributor"];
			if (!allowedTypes.includes(type)) {
				return res.status(400).json({ message: "Invalid user type" });
			}
			filters.type = type;
		}

		if (status) {
			const allowedStatuses = ["active", "inactive"];
			if (!allowedStatuses.includes(status)) {
				return res.status(400).json({ message: "Invalid user status" });
			}
			filters.status = status;
		}

		const allowedSortFields = [
			"firstName",
			"lastName",
			"email",
			"type",
			"status",
			"createdAt",
			"updatedAt",
		];

		const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
		const sortOrder = order === "asc" ? 1 : -1;

		const currentPage = Math.max(parseInt(page, 10) || 1, 1);
		const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
		const skip = (currentPage - 1) * pageSize;

		const pipeline = [{ $match: filters }];

		if (q?.trim()) {
			const searchRegex = {
				$regex: escapeRegex(q.trim()),
				$options: "i",
			};

			pipeline.push(
				{
					$addFields: {
						_searchName: {
							$trim: {
								input: {
									$concat: [
										{ $ifNull: ["$firstName", ""] },
										" ",
										{ $ifNull: ["$middleName", ""] },
										" ",
										{ $ifNull: ["$lastName", ""] },
									],
								},
							},
						},
					},
				},
				{
					$match: {
						$or: [
							{ id: searchRegex },
							{ _searchName: searchRegex },
							{ email: searchRegex },
							{ phone: searchRegex },
							{ bio: searchRegex },
							{ role: searchRegex },
							{ organization: searchRegex },
							{ type: searchRegex },
							{ status: searchRegex },
						],
					},
				},
			);
		}

		const [result] = await User.aggregate([
			...pipeline,
			{
				$facet: {
					users: [
						{ $sort: { [sortField]: sortOrder } },
						{ $skip: skip },
						{ $limit: pageSize },
						{
							$project: {
								_searchName: 0,
								password: 0,
								__v: 0,
							},
						},
					],
					count: [{ $count: "total" }],
				},
			},
		]);
		const total = result.count[0]?.total ?? 0;

		return res.status(200).json({
			users: result.users,
			pagination: {
				total,
				page: currentPage,
				limit: pageSize,
				totalPages: Math.ceil(total / pageSize),
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving user search results at this moment. Please retry",
		});
	}
};

module.exports = searchUsers;

const User = require("./user");
const { Schema } = require("mongoose");
const appDB = require("../db/dbConnect");

const permissionSchema = new Schema(
	{
		module: {
			type: String,
			required: true,
			enum: [
				"Dashboard",
				"Orders",
				"Inventory",
				"Transactions",
				"Support",
				"Admin Management",
				"Settings",
			],
		},
		status: {
			type: String,
			enum: ["active", "inactive"],
			default: "inactive",
		},
	},
	{ _id: false }
);

const accessControlSchema = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true,
		},
		permissions: {
			type: [permissionSchema],
			default: () => [
				{ module: "Dashboard" },
				{ module: "Orders" },
				{ module: "Inventory" },
				{ module: "Transactions" },
				{ module: "Support" },
				{ module: "Admin Management" },
				{ module: "Settings" },
			],
			validate: {
				validator: function (permissions) {
					const modules = permissions.map((p) => p.module);
					return modules.length === new Set(modules).size;
				},
				message: "Duplicate permission modules are not allowed",
			},
		},
		status: {
			type: String,
			required: true,
			default: "active",
			enum: ["active", "inactive"],
		},
	},
	{ timestamps: true, runValidators: true }
);

accessControlSchema.pre(["validate", "save"], async function (next) {
	try {
		const user = await User.findOne({ id: this.id });
		if (user?.type === "super-admin") {
			this.permissions = this.permissions.map((p) => ({
				...p,
				status: "active",
			}));
		}
		next();
	} catch (err) {
		next(err);
	}
});

module.exports = appDB.model("AccessControl", accessControlSchema);

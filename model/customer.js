const { Schema } = require("mongoose");
const appDB = require("../db/dbConnect");

const customerSchema = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true,
		},
		firstName: {
			type: String,
			default: null,
		},
		middleName: {
			type: String,
			default: null,
		},
		lastName: {
			type: String,
			default: null,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		avatar: {
			type: String,
			default: null,
		},
		phone: {
			type: String,
			default: null,
		},
		password: {
			type: String,
			required: true,
		},
		location: {
			type: String,
			default: null,
			set: (v) => (typeof v === "string" && v.trim().length > 0 ? v : null),
		},
		status: {
			type: String,
			required: true,
			default: "active",
			enum: ["active", "inactive"],
		},
	},
	{ timestamps: true }
);

module.exports = appDB.model("Customer", customerSchema);

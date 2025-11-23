const { Schema } = require("mongoose");
const appDB = require("../db/dbConnect");

const categorySchema = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true,
		},
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
		},
		status: {
			type: String,
			required: true,
			default: "active",
			enum: ["active", "inactive", "defunct"],
		},
	},
	{ timestamps: true }
);

module.exports = appDB.model("Category", categorySchema);

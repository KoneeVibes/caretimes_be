const { Schema } = require("mongoose");
const appDB = require("../db/dbConnect");

const productSchema = new Schema(
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
		category: {
			type: String,
			default: null,
		},
		stock: {
			default: 0,
			type: Number,
			required: true,
		},
		sold: {
			default: 0,
			type: Number,
			required: true,
		},
		price: {
			default: 0,
			type: Number,
			required: true,
		},
		thumbnail: {
			type: String,
			default: null,
		},
		images: {
			type: [String],
			default: null,
		},
		description: {
			type: String,
		},
		status: {
			type: String,
			required: true,
			default: "active",
			enum: ["active", "inactive", "pending"],
		},
	},
	{ timestamps: true }
);

module.exports = appDB.model("Product", productSchema);

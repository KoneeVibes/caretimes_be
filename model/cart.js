const { Schema } = require("mongoose");
const appDB = require("../db/dbConnect");

const cartSchema = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true,
		},
		customerId: {
			type: String,
			required: true,
		},
		productId: {
			type: String,
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			default: 1,
			min: 1,
		},
		unitPrice: {
			type: Number,
			required: true,
		},
		status: {
			type: String,
			required: true,
			default: "unpaid",
			enum: ["unpaid", "paid", "cancelled", "inactive"],
		},
	},
	{ timestamps: true }
);

cartSchema.index(
	{ customerId: 1, productId: 1, unitPrice: 1, status: 1 },
	{ unique: true, partialFilterExpression: { status: "unpaid" } }
);

module.exports = appDB.model("Cart", cartSchema);

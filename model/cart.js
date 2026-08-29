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
        // unpaid - a product in the cart that has not yet been paid for via an order
        // paid - a product in the cart that has been paid for via an order
        // cancelled - a product in the cart that has been cancelled via an order
        // disputed - a product in the cart that has been disputed by a customer
        // inactive - a product in the cart that has been removed and can not be ordered
		status: {
			type: String,
			required: true,
			default: "unpaid",
			enum: ["unpaid", "paid", "cancelled", "inactive", "disputed"],
		},
	},
	{ timestamps: true },
);

cartSchema.index(
	{ customerId: 1, productId: 1, unitPrice: 1, status: 1 },
	{ unique: true, partialFilterExpression: { status: "unpaid" } },
);

const Cart = appDB.model("Cart", cartSchema);

module.exports = {
	cartSchema,
	Cart,
};

const { Schema } = require("mongoose");
const appDB = require("../db/dbConnect");

const orderItemSchema = new Schema(
	{
		cartId: {
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
			min: 1,
		},
		unitPrice: {
			type: Number,
			required: true,
			min: 0,
		},
	},
	{ _id: false },
);

const orderSchema = new Schema(
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
		transactionAccessCode: {
			type: String,
			required: true,
		},
		transactionReference: {
			type: String,
			required: true,
		},
		cartItems: {
			type: [orderItemSchema],
			required: true,
			validate: {
				validator: (items) => items.length > 0,
				message: "An order must contain at least one item.",
			},
		},
		subTotal: {
			type: Number,
			required: true,
			min: 0,
		},
		deliveryFee: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		tax: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		discount: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		totalPayable: {
			type: Number,
			required: true,
			min: 0,
		},
		// unfulfilled - an order that has been created, but not yet paid for
		// fulfilled - an order that has been paid for and delivered to customer
		// paid - an order that has been paid for
		// cancelled - an order that has been cancelled
		// disputed - an order that has atleast one cart item that is being disputed by a customer
		status: {
			type: String,
			required: true,
			default: "unfulfilled",
			enum: ["fulfilled", "paid", "unfulfilled", "cancelled", "disputed"],
		},
	},
	{ timestamps: true },
);

orderSchema.pre("validate", function () {
	this.subTotal = (this.cartItems ?? []).reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0,
	);
	this.totalPayable =
		this.subTotal + this.deliveryFee + this.tax - this.discount;
});

const Order = appDB.model("Order", orderSchema);

module.exports = {
	orderItemSchema,
	Order,
};

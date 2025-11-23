const { Schema } = require("mongoose");
const appDB = require("../db/dbConnect");

const authVerificationOTPSchema = new Schema({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	requester: {
		type: String,
		required: true,
		ref: "User",
	},
	otp: {
		type: String,
		required: true,
	},
	isUsed: {
		type: Boolean,
		default: false,
	},
	client: {
		type: String,
		required: true,
		enum: ["customer", "admin"],
	},
	createdAt: { type: Date, expires: "5m", default: Date.now },
});

module.exports = appDB.model("authVerificationOTP", authVerificationOTPSchema);

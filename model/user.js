const bcrypt = require("bcrypt");
const { Schema } = require("mongoose");
const appDB = require("../db/dbConnect");

const userSchema = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true,
		},
		firstName: {
			type: String,
			required: true,
		},
		middleName: {
			type: String,
			default: null,
		},
		lastName: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		// we may have to have a compound index that combines email and type
		// so that emails don't have to unique; but email&type has to be unique
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
		type: {
			type: String,
			required: true,
			enum: ["super-admin", "admin", "distributor"],
		},
		role: {
			type: String,
			default: null,
		},
		organization: {
			type: String,
			default: null,
		},
		status: {
			type: String,
			required: true,
			default: "active",
			enum: ["active", "inactive"],
		},
		passwordChanged: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

userSchema.pre("save", async function (next) {
	if (this.isModified("password")) {
		const saltRounds = 10;
		this.password = await bcrypt.hash(this.password, saltRounds);
	}
	next();
});

module.exports = appDB.model("User", userSchema);

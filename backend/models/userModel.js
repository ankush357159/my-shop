const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please Enter Your Name"],
		maxLength: [30, "Name cannot exceed 30 characters"],
		minLength: [4, "Name should have more than 4 characters"],
	},
	email: {
		type: String,
		required: [true, "Please Enter Your Email"],
		unique: true,
		validate: [validator.isEmail, "Please Enter a valid Email"],
	},
	password: {
		type: String,
		required: [true, "Please Enter Your Password"],
		minLength: [8, "Password should be greater than 8 characters"],
		select: false,
	},
	avatar: {
		public_id: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
	},
	role: {
		type: String,
		default: "user",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},

	resetPasswordToken: String,
	resetPasswordExpire: Date,
});

//Encryting Passwords before Saving
userSchema.pre("save", async function (next) {
	// Mongoose Pre middleware functions are executed one after another, when each middleware calls next.
	if (!this.isModified("password")) {
		//Document.prototype.isModified() returns true if any of the given paths is modified, else false. If no arguments, returns true if any path in this document is modified.
		//If path is given, checks if a path or any full path containing path as part of its path chain has been modified.
		next();
	}
	this.password = await bcrypt.hash(this.password, 10);
});

//Return JSON web token
userSchema.methods.getJWTToken = function () {
	return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
		//jwt.sign(payload, secretOrPrivateKey, [options, callback])
		expiresIn: process.env.JWT_EXPIRES_TIME,
	});
};

//Compare Password
userSchema.methods.comparePassword = async function (password) {
	return await bcrypt.compare(password, this.password);
};

//Generating password reset token
userSchema.methods.getResetPasswordToken = function () {
	//Generating token
	const resetToken = crypto.randomBytes(20).toString("hex");

	//Hashing and adding resetPasswordToken to userSchema
	this.resetPasswordToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex");

	//The crypto module provides cryptographic functionality that includes a set of wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions.

	this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; //Expires in an hour

	return resetToken;
};

module.exports = mongoose.model("User", userSchema);

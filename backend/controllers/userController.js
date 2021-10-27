const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const ErrorHandler = require("../utils/errorHandler");
const cloudinary = require("cloudinary");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
	// const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
	// 	folder: "avatars",
	// 	width: 150,
	// 	crop: scale,
	// });

	const { name, email, password } = req.body;
	const user = await User.create({
		name,
		email,
		password,
		// avatar: {
		// 	public_id: myCloud.public_id,
		// 	url: myCloud.secure_url,
		// },
	});
	sendToken(user, 201, res);
});

//Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next(new ErrorHandler("Please enter email and password", 400)); //400 - Bad request
	}

	const user = await User.findOne({ email }).select("+password");
	//The findOne() method returns the first occurrence in the selection.

	if (!user) {
		return next(new ErrorHandler("Invalid email or  password", 401)); //401- unauthorized
	}

	const isPasswordMatched = await user.comparePassword(password);

	if (!isPasswordMatched) {
		return next(new ErrorHandler("Invalid email or password", 401));
	}

	sendToken(user, 200, res);
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
	res.cookie("token", null, {
		expires: new Date(Date.now()),
		httpOnly: true,
	});

	res.status(200).json({
		success: true,
		message: "Logged out",
	});
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return next(new ErrorHandler("User not found", 404)); //404- Not found
	}

	// Get reset password token
	const resetToken = user.getResetPasswordToken();

	await user.save({ validateBeforeSave: false });
	//By default, documents are automatically validated before they are saved to the database. This is to prevent saving an invalid document. If validation is required to be handled manually, and be able to save objects which don't pass validation, it can be set to validateBeforeSave to false.

	const resetPasswordUrl = `${req.protocol}://${req.get(
		//Express.js req.protocol contains the request protocol string: either http or (for TLS requests) https.
		"host"
	)}/api/v1/password/reset/${resetToken}`;

	const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

	try {
		await sendEmail({
			email: user.email,
			subject: `My-shop recovery password`,
			message,
		});

		res.status(200).json({
			success: true,
			message: `Email send to ${user.email} successfully`,
		});
	} catch (error) {
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({ validateBeforeSave: false });

		return next(new ErrorHandler(error.message, 500)); //500 - Internal server error
	}
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
	// Creating token hash
	const resetPasswordToken = crypto
		.createHash("sha256")
		.update(req.params.token)
		.digest("hex");

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: { $gt: Date.now() },
	});

	if (!user) {
		return next(
			new ErrorHandler("Reset password token is invalid or expired", 400)
		);
	}

	if (req.body.password !== req.body.confirmPassword) {
		return next(new ErrorHandler("Password does not match", 400));
	}
	user.password = req.body.password;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;

	await user.save();
	sendToken(user, 200, res);
});

// Get user details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.user.id);

	res.status(200).json({
		success: true,
		user,
	});
});

//Update user password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.user.id).select("+password");
	//Query.prototype.select() method specifies which document fields to include or exclude (also known as the query "projection")

	const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

	if (!isPasswordMatched) {
		return next(new ErrorHandler("Old password is incorrect", 400));
	}

	if (req.body.newPassword !== req.body.confirmPassword) {
		return next(new ErrorHandler("Password does not match", 400));
	}

	user.password = req.body.newPassword;

	await user.save();

	sendToken(user, 200, res);
});

//Update user profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
	const newUserData = {
		name: req.body.name,
		email: req.body.email,
	};
	// if (req.body.avatar !== "") {
	// 	const user = await User.findById(req.user.id);

	// 	const imageId = user.avatar.public_id;

	// 	await cloudinary.v2.uploader.destroy(imageId);

	// 	const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
	// 		folder: "avatars",
	// 		width: 150,
	// 		crop: "scale",
	// 	});

	// 	newUserData.avatar = {
	// 		public_id: myCloud.public_id,
	// 		url: myCloud.secure_url,
	// 	};
	// }

	const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});

	res.status(200).json({
		success: true,
		message: "Profile changed successfully",
	});
});

//Get All users (Admin)
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
	const users = await User.find();

	res.status(200).json({
		success: true,
		users,
	});
});

//Get Single User (Admin)
exports.getUser = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(
			new ErrorHandler(`User does not exit with id ${req.params.id}, 400`)
		);
	}

	res.status(200).json({
		success: true,
		user,
	});
});

//Update User role (Admin)
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
	const newUserData = {
		name: req.body.name,
		email: req.body.email,
		role: req.body.role,
	};

	await User.findByIdAndUpdate(req.params.id, newUserData, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});

	res.status(200).json({
		success: true,
		message: "User profile updated",
	});
});

//Delete User (Admin)
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(
			new ErrorHandler(`User does not exist with id ${req.params.id}, 400`)
		);
	}

	// const imageId = user.avatar.public_id;

	// await cloudinary.v2.uploader.destroy(imageId);

	await user.remove();

	res.status(200).json({
		success: true,
		message: "User deleted successfully",
	});
});

// req.params
// This property is an object containing properties mapped to the named route “parameters”. For example, if you have the route /user/:name, then the “name” property is available as req.params.name. This object defaults to {}.

// req.body
// Contains key-value pairs of data submitted in the request body. By default, it is undefined, and is populated when you use body-parsing middleware such as body-parser and multer.

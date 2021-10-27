const ErrorHandler = require("../utils/errorHandler");
const jwt = require("jsonwebtoken");

const catchAsyncErrors = require("./catchAsyncErrors");
const User = require("../models/userModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
	const { token } = req.cookies;

	if (!token) {
		return next(new ErrorHandler("Please login to access this resource", 401)); //401 - unauthorized
	}

	const decodedData = jwt.verify(token, process.env.JWT_SECRET);
	// To verify the string, simply one need to pass it to the verify method in the library, along with the secret key that was used to sign the token:
	// jwt.verify(token,secretKey)

	req.user = await User.findById(decodedData.id);

	next();
});

exports.authorizeRoles = (...role) => {
	return (req, res, next) => {
		if (!role.includes(req.user.role)) {
			return next(
				new ErrorHandler(
					`Role: ${req.user.role} is not allowed to access this resource`,
					403
				)
			);
		}
		next();
	};
};

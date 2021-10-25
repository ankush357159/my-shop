const catchAsyncErrors = (fn) => (req, res, next) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsyncErrors;

//try-catch can also be used to handle errors. However express offers more elegent solution
// by allowing error handling middleware to take care of errors.

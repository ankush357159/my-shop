class ErrorHandler extends Error {
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;

		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = ErrorHandler;

// Error objects capture a "stack trace" detailing the point in the code at which the Error was instantiated, and may provide a text description of the error.

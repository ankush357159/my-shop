//Packages import
const dotenv = require("dotenv");
const mongoose = require("mongoose");

//Files import
const app = require("./app");
const mongoDatabase = require("./mongoDatabase");

// Handling uncaught exception
// uncaughtException event is emitted when an uncaught javascript exception bubbles all the way back to the event loop.
process.on("uncaughtException", (err, origin) => {
	console.log(`Caught Exception: ${err}, Exception origin: ${origin}`);
	console.log("Shutting down the server due to unhandled uncaught exception");
	process.exit(1);
});

// Unhandled Promise Rejection
// unhandledRejection event is emitted whenever a Promise is rejected
//and no error handler is attached to the promise within a turn of the event loop
process.on("unhandledRejection", (reason, promise) => {
	console.log(`Unhandled Rejection at: ${promise}, Reason: ${reason}`);
	console.log(`Shutting down the server due to unhandled Promise Rejection`);
});

//Config
dotenv.config({ path: "backend/config/config.env" });

// Connecting to database
mongoDatabase();
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error: "));
db.once("open", () => {
	console.log("Mongodb database connected successfully");
});

const server = app.listen(process.env.PORT, () => {
	console.log(`Server is running on http://localhost:${process.env.PORT}`);
});

//Packages import
const mongoose = require("mongoose");

const mongoDatabase = async () => {
	mongoose
		.connect(process.env.MONGODB_URI1, {
			useNewUrlParser: true,
		})
		.then((data) => {
			console.log(`Mongodb connected with the server: ${data.connection.host}`);
		});
};

module.exports = mongoDatabase;

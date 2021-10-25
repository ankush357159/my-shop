//Packages import
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());

//Route imports
const product = require("./routes/productRoute");

app.use("/api/v1", product);

module.exports = app;

const Product = require("../models/productModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/ApiFeatures");
const ErrorHandler = require("../utils/errorHandler");

//Admin

// Create Product -- Admin
exports.createProduct = async (req, res, next) => {
	const product = await Product.create(req.body);

	//The Object.create() method creates a new object, using an existing object as the prototype of the newly created object.
	//req.body property contains key value pairs of the data submitted in the request body.
	// By default, it is undefined and is populated when you use a middleware called body-parsing such as express.urlencoded() or express.json().

	res.status(201).json({
		success: true,
		product,
	});
};

// Get All Products -- Admin
exports.getAllProductsAdmin = catchAsyncErrors(async (req, res, next) => {
	const products = await Product.find();

	res.status(200).json({
		success: true,
		products,
	});
});

//Get All products
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
	const resultPerPage = 8;
	const productsCount = await Product.countDocuments();

	const apiFeature = new ApiFeatures(Product.find(), req.query)
		.search()
		.filter();

	let products = await apiFeature.query;
	let filteredProductsCount = products.length;
	apiFeature.pagination(resultPerPage);

	// products = await apiFeature.query;
	//Writing above line of code will result in error "MongooseError: Query was already executed: Product.find({})"

	res.status(200).json({
		success: true,
		products,
		productsCount,
		resultPerPage,
		filteredProductsCount,
	});
});

// Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
	const product = await Product.findById(req.params.id);

	if (!product) {
		return next(new ErrorHandler("Product not found", 404)); // 404-Not found
	}

	res.status(200).json({
		success: true,
		product,
	});
});

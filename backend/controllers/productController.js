const cloudinary = require("cloudinary");
const Product = require("../models/productModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/ApiFeatures");
const ErrorHandler = require("../utils/errorHandler");

//Admin

// Create Product -- Admin
exports.createProductAdmin = async (req, res, next) => {
	// let images = [];

	// if (typeof req.body.images === "string") {
	// 	images.push(req.body.images);
	// } else {
	// 	images = req.body.images;
	// }

	// const imagesLinks = [];

	// for (let i = 0; i < images.length; i++) {
	// 	const result = await cloudinary.v2.uploader.upload(images[i], {
	// 		folder: "products",
	// 	});

	// 	imagesLinks.push({
	// 		public_id: result.public_id,
	// 		url: result.secure_url,
	// 	});
	// }

	// req.body.images = imagesLinks;
	// req.body.user = req.user.id;

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
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
	const products = await Product.find();

	res.status(200).json({
		success: true,
		products,
	});
});

// Update Product -- Admin
exports.updateProductAdmin = catchAsyncErrors(async (req, res, next) => {
	let product = await Product.findById(req.params.id);

	if (!product) {
		return next(new ErrorHandler("Product not found", 404));
	}

	// // Images Start Here
	// let images = [];

	// if (typeof req.body.images === "string") {
	// 	images.push(req.body.images);
	// } else {
	// 	images = req.body.images;
	// }

	// if (images !== undefined) {
	// 	// Deleting Images From Cloudinary
	// 	for (let i = 0; i < product.images.length; i++) {
	// 		await cloudinary.v2.uploader.destroy(product.images[i].public_id);
	// 	}

	// 	const imagesLinks = [];

	// 	for (let i = 0; i < images.length; i++) {
	// 		const result = await cloudinary.v2.uploader.upload(images[i], {
	// 			folder: "products",
	// 		});

	// 		imagesLinks.push({
	// 			public_id: result.public_id,
	// 			url: result.secure_url,
	// 		});
	// 	}

	// 	req.body.images = imagesLinks;
	// }

	product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		//db.collection.findOneAndUpdate() updates the first matching document in the collection that matches the filter. If no document matches the filter, no document is updated.
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});
	res.status(200).json({
		success: true,
		product,
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

//Delete Product
exports.deleteProductAdmin = catchAsyncErrors(async (req, res, next) => {
	const product = await Product.findById(req.params.id);

	if (!product) {
		return next(new ErrorHandler("Product not found", 404)); // 404-Not found
	}

	// Deleting Images From Cloudinary
	//  for (let i = 0; i < product.images.length; i++) {
	// 	await cloudinary.v2.uploader.destroy(product.images[i].public_id);
	//   }

	await product.remove();

	res.status(200).json({
		success: true,
		message: "Product deleted successfully",
	});
});

//Create New Review or update Review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
	const { rating, comment, productId } = req.body;

	const review = {
		user: req.user._id,
		name: req.user.name,
		rating: Number(rating),
		comment,
	};

	const product = await Product.findById(productId);

	const isReviewed = product.reviews.find(
		(rev) => rev.user.toString() === req.user._id.toString()
	);

	if (isReviewed) {
		product.reviews.forEach((rev) => {
			if (rev.user.toString() === req.user._id.toString())
				(review.rating = rating), (review.comment = comment);
		});
	} else {
		product.reviews.push(review);
		product.numOfReviews = product.reviews.length;
	}

	let avg = 0;

	product.reviews.forEach((rev) => (avg += rev.rating));

	product.ratings = avg / product.reviews.length;

	await product.save({ validationBeforeSave: false });

	res.status(200).json({
		success: true,
	});
});

//Get all reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
	const product = await Product.findById(req.query.id);

	if (!product) {
		return next(new ErrorHandler("Product not found", 404));
	}

	res.status(200).json({
		success: true,
		reviews: product.reviews,
	});
});

//Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
	const product = await Product.findById(req.query.productId);

	if (!product) {
		return next(new ErrorHandler("Product not found", 404));
	}

	const reviews = product.reviews.filter(
		(rev) => rev._id.toString() !== req.query.id.toString()
	);

	// Postman, pass req.query.productId) and req.query.id as parameters
	let avg = 0;
	reviews.forEach((rev) => {
		avg += rev.rating;
	});

	let ratings = 0;

	if (reviews.length === 0) {
		ratings = 0;
	} else {
		ratings = avg / reviews.length;
	}

	const numOfReviews = reviews.length;

	await Product.findByIdAndUpdate(
		req.query.productId,
		{
			reviews,
			ratings,
			numOfReviews,
		},
		{
			new: true,
			runValidators: true,
			useFindAndModify: false,
		}
	);
	res.status(200).json({
		success: true,
	});
});

const express = require("express");
const {
	getAllProducts,
	createProductAdmin,
	getProductDetails,
	getAdminProducts,
	updateProductAdmin,
	deleteProductAdmin,
	createProductReview,
	getProductReviews,
	deleteReview,
} = require("../controllers/productController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.route("/products").get(getAllProducts);

router
	.route("/admin/products")
	.get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);

router
	.route("/admin/product/new")
	.post(isAuthenticatedUser, authorizeRoles("admin"), createProductAdmin);

router
	.route("/admin/product/:id")
	.put(isAuthenticatedUser, authorizeRoles("admin"), updateProductAdmin)
	.delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProductAdmin);

router.route("/product/:id").get(getProductDetails);

router.route("/review").put(isAuthenticatedUser, createProductReview);

router
	.route("/reviews")
	.get(getProductReviews)
	.delete(isAuthenticatedUser, deleteReview);

module.exports = router;

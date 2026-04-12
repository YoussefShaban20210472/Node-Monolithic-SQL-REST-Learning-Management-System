// userRoutes.js
const express = require("express");
const userController = require("../controller/userController");
const authorizeAdminMiddleware = require("../middleware/authorizeAdminMiddleware");
const router = express.Router();

router.get("/user/me", userController.findUserById);

router.use(authorizeAdminMiddleware);
// Define routes
router.post("/user", userController.createUser); // POST request to create a user

// Define routes
router.get("/user/all", userController.getAllUsers); // POST request to create a user

router.get("/user/:id", userController.findUserById); // POST request to create a user
module.exports = router;

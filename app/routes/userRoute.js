// userRoutes.js
const express = require("express");
const userController = require("../controller/userController");
const authorizeAdminMiddleware = require("../middleware/authorizeAdminMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.get("/user/me", userController.findUserById);
router.delete("/user/me", userController.deleteUserById);

router.use(authorizeAdminMiddleware);
// Define routes
router.post("/user", userController.createUser); // POST request to create a user

// Define routes
router.get("/user/all", userController.getAllUsers); // POST request to create a user

router.get("/user/:id", idFormatMiddleware, userController.findUserById); // POST request to create a user
router.delete("/user/:id", idFormatMiddleware, userController.deleteUserById); // POST request to create a user
module.exports = router;

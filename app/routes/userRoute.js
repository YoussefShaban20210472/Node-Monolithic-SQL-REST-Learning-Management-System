// userRoutes.js
const express = require("express");
const userController = require("../controller/userController");
const authorizeAdminMiddleware = require("../middleware/authorizeAdminMiddleware");
const idFormatMiddleware = require("../middleware/idFormatMiddleware");
const router = express.Router();

router.get("/user/me", userController.findUserById);
router.delete("/user/me", userController.deleteUserById);
router.put("/user/me", userController.updateUserById);

router.use(authorizeAdminMiddleware);
// Define routes
router.post("/user", userController.createUser); // POST request to create a user

// Define routes
router.get("/user/all", userController.getAllUsers); // POST request to create a user

router.use(idFormatMiddleware);
router.get("/user/:id", userController.findUserById); // POST request to create a user
router.delete("/user/:id", userController.deleteUserById); // POST request to create a user
router.put("/user/:id", userController.updateUserById); // POST request to create a user
module.exports = router;

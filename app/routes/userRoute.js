// userRoutes.js
const express = require("express");
const { createUser } = require("../controller/userController");
const authorizeAdminMiddleware = require("../middleware/authorizeAdminMiddleware");
const router = express.Router();

// Define routes
router.post("/user", authorizeAdminMiddleware, createUser); // POST request to create a user

module.exports = router;

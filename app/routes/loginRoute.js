// userRoutes.js
const express = require("express");
const { loginUser } = require("../controller/authController");
const router = express.Router();

// Define routes
router.post("/user/login", loginUser); 

module.exports = router;

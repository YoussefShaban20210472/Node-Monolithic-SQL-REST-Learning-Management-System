const express = require("express");
const { logoutUser } = require("../controller/authController");
const router = express.Router();

// Define routes
router.post("/user/logout", logoutUser);

module.exports = router;

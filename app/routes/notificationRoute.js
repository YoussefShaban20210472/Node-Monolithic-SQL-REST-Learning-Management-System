// userRoutes.js
const express = require("express");
const notificationController = require("../controller/notificationController");
const router = express.Router();

router.get("/notification", notificationController.getNotifications);

module.exports = router;

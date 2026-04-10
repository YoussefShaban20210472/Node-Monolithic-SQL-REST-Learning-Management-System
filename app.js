const express = require("express");
const app = express();
const errorMiddleware = require("./app/middleware/errorMiddleware");
const authMiddleware = require("./app/middleware/authMiddleware");
const userRoute = require("./app/routes/userRoute");
const loginRoute = require("./app/routes/loginRoute");
const logoutRoute = require("./app/routes/logoutRoute");
app.use(express.json());

// Public Routes
app.use(loginRoute);

app.use(authMiddleware);

// Protected Routes
app.use(logoutRoute);

app.use(userRoute);

// Catch Errors
app.use(errorMiddleware);

module.exports = app;

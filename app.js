const express = require("express");
const app = express();
const errorMiddleware = require("./app/middleware/errorMiddleware");
const authMiddleware = require("./app/middleware/authMiddleware");
const userRoute = require("./app/routes/userRoute");
const courseRoute = require("./app/routes/courseRoute");
const enrollmentRoute = require("./app/routes/enrollmentRoute");
const lessonRoute = require("./app/routes/lessonRoute");
const assignmentRoute = require("./app/routes/assignmentRoute");
const attendanceRoute = require("./app/routes/attendanceRoute");
const mediaFileRoute = require("./app/routes/mediaFileRoute");
const loginRoute = require("./app/routes/loginRoute");
const logoutRoute = require("./app/routes/logoutRoute");
app.use(express.json());

// Public Routes
app.use(loginRoute);

app.use(authMiddleware);

// Protected Routes
app.use(logoutRoute);

app.use(lessonRoute);
app.use(assignmentRoute);
app.use(mediaFileRoute);
app.use(enrollmentRoute);
app.use(attendanceRoute);
app.use(courseRoute);
app.use(userRoute);

// Catch Errors
app.use(errorMiddleware);

module.exports = app;

const { authenticateUser } = require("../service/authService");

const authMiddleware = async (req, res, next) => {
  // Extract Token
  const token = req.headers.authorization?.split(" ")[1] || "";
  const user = await authenticateUser(token);
  req.user = user;
  next();
};

module.exports = authMiddleware;

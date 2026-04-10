const authService = require("../service/authService");
async function loginUser(req, res) {
  // Create user
  const token = await authService.loginUser(req.body);
  res.status(200).json({ token });
}

async function logoutUser(req, res) {
  const user = req.user;
  const token = req.headers.authorization?.split(" ")[1] || "";
  await authService.logoutUser(user, token);
  res.status(200).json({ message: "User Logout Successfully" });
}
module.exports = { loginUser, logoutUser };

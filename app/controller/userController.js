const userService = require("../service/userService");
async function createUser(req, res) {
  // Create user
  const user = await userService.createUser(req.body);
  res.status(201).json({ user });
}

module.exports = { createUser };

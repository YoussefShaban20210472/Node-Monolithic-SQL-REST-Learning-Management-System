const userService = require("../service/userService");
async function createUser(req, res) {
  // Create user
  const user = await userService.createUser(req.body);
  res.status(201).json({ user });
}

async function getAllUsers(_, res) {
  // get all users
  const users = await userService.getAllUsers();
  res.status(200).json({ users });
}

module.exports = { createUser, getAllUsers };

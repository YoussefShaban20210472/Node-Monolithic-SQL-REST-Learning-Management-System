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

async function findUserById(req, res) {
  const id = req.params.id || req.user.id;
  const user = await userService.findUserById(id);
  res.status(200).json({ user });
}

module.exports = { createUser, getAllUsers, findUserById };

const createUserSchema = require("../validator/userValidator");
const bcrypt = require("bcrypt");
const userModel = require("../model/userModel");
const redis = require("../cache/redis");
async function createUser(user) {
  // Validate user

  // Schema Validation
  const validatedUser = createUserSchema.parse(user);

  // Hash password
  const hashedPassword = await bcrypt.hash(user.password, 10);
  validatedUser.password = hashedPassword;

  // Create user
  const createdUser = await userModel.createUser(validatedUser);
  delete createdUser.password;
  return createdUser;
}

async function getAllUsers() {
  const users = await userModel.getAllUsers();
  return users;
}

async function findUserById(id) {
  const user = await userModel.findUserById(id);
  if (user == null) {
    throw { status: 404, message: "Accout Not Found" };
  }
  return user;
}
async function deleteUserById(id) {
  const user = await userModel.deleteUserById(id);
  if (user == null) {
    throw { status: 404, message: "Accout Not Found" };
  }
  await redis.set(`blacklist_${id}`);
  return user;
}
module.exports = { createUser, getAllUsers, findUserById, deleteUserById };

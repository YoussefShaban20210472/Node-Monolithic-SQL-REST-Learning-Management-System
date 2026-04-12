const createUserSchema = require("../validator/userValidator");
const bcrypt = require("bcrypt");
const userModel = require("../model/userModel");

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
module.exports = { createUser, getAllUsers };

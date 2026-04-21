const {
  createUserSchema,
  createUserUpdateSchema,
} = require("../validator/userValidator");
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
  const userTokenVersion = (await redis.get(`user_${id}_tokenVersion`)) || "0";
  await redis.set(
    `user_${user.id}_tokenVersion`,
    `${Number(userTokenVersion) + 1}`,
  );
  return user;
}

async function updateUserById(id, user) {
  // Validate user
  // Schema Validation
  const validatedUser = createUserUpdateSchema.parse(user);
  let safeUser = {};
  const safeFields = [
    "first_name",
    "last_name",
    "email",
    "phone_number",
    "address",
  ];
  safeFields.forEach((safeField) => {
    if (validatedUser[safeField] != null) {
      safeUser[safeField] = validatedUser[safeField];
    }
  });
  if (Object.keys(safeUser).length === 0) {
    throw {
      status: 400,
      message:
        "You have to provide at least one allowed field to update the profile",
    };
  }
  const updatedUser = await userModel.updateUserById(id, safeUser);
  if (updatedUser == null) {
    throw { status: 404, message: "Accout Not Found" };
  }
  if (validatedUser["email"] != null) {
    const userTokenVersion =
      (await redis.get(`user_${id}_tokenVersion`)) || "0";

    await redis.set(
      `user_${id}_tokenVersion`,
      `${Number(userTokenVersion) + 1}`,
    );
  }
  return updatedUser;
}
async function assertValidUserId(role, id) {
  const user = await findUserById(id);
  if (user.role != role) {
    throw { status: 400, message: `${role}_id must be id of ${role}` };
  }
}

module.exports = {
  createUser,
  getAllUsers,
  findUserById,
  deleteUserById,
  updateUserById,
  assertValidUserId,
};

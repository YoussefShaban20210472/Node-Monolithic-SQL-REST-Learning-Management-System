const createAuthSchema = require("../validator/authValidator");
const bcrypt = require("bcrypt");
const userModel = require("../model/userModel");
const redis = require("../cache/redis");
const { generateToken, verfiyToken } = require("../jwt/JWT");
const { JsonWebTokenError } = require("jsonwebtoken");

async function authenticateUser(token) {
  try {
    // Verfiy Token
    const decoded = verfiyToken(token);

    //  Check blacklist
    const isBlacklisted = await redis.get(`blacklist_${token}`);

    if (isBlacklisted) {
      throw "BLACKLIST";
    }
    return decoded;
  } catch (error) {
    if (error instanceof JsonWebTokenError || error === "BLACKLIST")
      throw { status: 401, message: "Access denied" };
    throw error;
  }
}
async function loginUser(user) {
  // Validate user

  // Schema Validation
  const validatedUser = createAuthSchema.parse(user);

  // Find user
  const foundUser = (await userModel.findUserByEmail(validatedUser.email)) || {
    password: "",
  };

  // Match password
  const isMatch = await bcrypt.compare(user.password, foundUser.password);

  if (!isMatch) {
    throw { status: 404, message: "Accout Not Found" };
  }
  // Generate Token
  const token = generateToken({ id: foundUser.id, role: foundUser.role });
  return token;
}

async function logoutUser(user, token) {
  // remaining lifetime
  const expiresIn = user.exp - Math.floor(Date.now() / 1000);
  await redis.set(`blacklist_${token}`, "true", expiresIn);
  return;
}
module.exports = { loginUser, authenticateUser, logoutUser };

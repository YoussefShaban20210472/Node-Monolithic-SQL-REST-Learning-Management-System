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
    const userTokenVersion =
      (await redis.get(`user_${decoded.id}_tokenVersion`)) || "0";
    //  Check blacklist
    const isBlacklisted = decoded.tokenVersion !== userTokenVersion;

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
  const userTokenVersion =
    (await redis.get(`user_${foundUser.id}_tokenVersion`)) || "0";
  // Generate Token
  const token = generateToken({
    id: `${foundUser.id}`,
    role: foundUser.role,
    tokenVersion: userTokenVersion,
  });
  return token;
}

async function logoutUser(user) {
  const userTokenVersion =
    (await redis.get(`user_${user.id}_tokenVersion`)) || "0";
  // remaining lifetime
  const expiresIn = user.exp - Math.floor(Date.now() / 1000);
  await redis.set(
    `user_${user.id}_tokenVersion`,
    `${Number(userTokenVersion) + 1}`,
    expiresIn,
  );
  return;
}

module.exports = { loginUser, authenticateUser, logoutUser };

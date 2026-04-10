const jwt = require("jsonwebtoken");
const config = require("../../config");
const generateToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: config.JWT.expiresIn,
  });
};

const verfiyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
};

module.exports = { generateToken, verfiyToken };

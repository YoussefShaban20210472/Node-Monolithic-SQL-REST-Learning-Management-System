const config = {
  JWT: {
    expiresIn: "15m",
  },
  REDIS: {
    expiresIn: 15 * 60, // 15 minutes
  },
};

module.exports = config;

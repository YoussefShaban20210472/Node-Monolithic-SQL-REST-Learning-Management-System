const { createClient } = require("redis");
const config = require("../../config");

// const redisConfig = {
//   development: { url: process.env.REDIS_URL },
//   production: {
//     url: process.env.REDIS_URL,
//   },
//   test: { url: process.env.TEST_REDIS_URL },
// };
// const env = process.env.NODE_ENV || "development";

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }
  async connect() {
    if (this.isConnected) return;
    try {
      // this.client = createClient(redisConfig[env]);
      this.client = createClient({
        url: process.env.REDIS_URL,
      });

      await this.client.connect();
      this.isConnected = true;
      console.log("Redis connected successfully");
    } catch (error) {
      throw error; // Re-throw to be caught by middleware
    }
  }

  async get(key) {
    await this.connect();
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error("Redis GET error:", error);
      throw error;
    }
  }

  async set(key, value = "true", expiresIn = null) {
    await this.connect();
    try {
      return await this.client.set(
        key,
        value,
        "EX",
        expiresIn || config.REDIS.expiresIn,
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RedisClient();

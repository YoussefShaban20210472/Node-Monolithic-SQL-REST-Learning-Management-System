const { Pool } = require("pg");
// const dotenv = require("dotenv");
// dotenv.config();

// const config = {
//   development: {
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT,
//   },
//   test: {
//     host: process.env.TEST_DB_HOST,
//     user: process.env.TEST_DB_USER,
//     password: process.env.TEST_DB_PASSWORD,
//     database: process.env.TEST_DB_NAME,
//     port: process.env.TEST_DB_PORT,
//   },
//   production: {
//     connectionString: process.env.DATABASE_URL,
//     ssl: {
//       rejectUnauthorized: false,
//     },
//   },
// };

// const env = process.env.NODE_ENV || "development";

// const db = new Pool(config[env]);
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
module.exports = db;

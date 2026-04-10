function handleRedisError(error) {
  if (!error.errno) return null;

  const code = error.code;
  const message = error.message || "";

  switch (true) {
    // 🟥 Connection refused
    case code === "ECONNREFUSED":
      return {
        status: 503,
        errors: [{ message: "Redis service unavailable (connection refused)" }],
      };

    // 🟥 Timeout
    case code === "ETIMEDOUT":
      return {
        status: 504,
        errors: [{ message: "Redis request timeout" }],
      };

    // 🟥 Host not found
    case code === "ENOTFOUND":
      return {
        status: 500,
        errors: [{ message: "Redis host not found" }],
      };

    // 🟥 Too many clients
    case message.includes("max number of clients"):
      return {
        status: 503,
        errors: [{ message: "Redis overloaded, try again later" }],
      };

    // 🟥 WRONGTYPE
    case message.includes("WRONGTYPE"):
      return {
        status: 400,
        errors: [{ message: "Wrong Redis data type operation" }],
      };

    // 🟥 Invalid command
    case message.includes("ERR"):
      return {
        status: 400,
        errors: [{ message: "Invalid Redis command" }],
      };

    // 🟥 Default
    default:
      return {
        status: 500,
        errors: [{ message: "Redis internal error" }],
      };
  }
}

module.exports = handleRedisError;

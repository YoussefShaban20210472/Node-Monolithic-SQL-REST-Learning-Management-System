async function ensureJsonBodyRequestMiddleware(req, res, next) {
  if (!req.is("application/json")) {
    throw { status: 400, message: "Content-Type must be application/json" };
  }
  const body = req.body;
  // 1. Missing or empty
  if (!body || Object.keys(body).length === 0) {
    throw { status: 400, message: "Request body is required" };
  }

  // 2. Must be object (not array, not number, not string)
  if (typeof body !== "object" || Array.isArray(body)) {
    throw { status: 400, message: "Body must be a JSON object" };
  }
  next();
}

module.exports = ensureJsonBodyRequestMiddleware;

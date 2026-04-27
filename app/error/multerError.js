const multer = require("multer");
function handleMulterError(error) {
  if (!(error instanceof multer.MulterError)) return null;
  if (error.code === "LIMIT_FILE_SIZE") {
    return {
      status: 400,
      errors: [{ message: "File too large. Max allowed size is 50MB." }],
    };
  }
}

module.exports = handleMulterError;

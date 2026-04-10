const { ZodError } = require("zod");
function handleZodError(error) {
  if (error instanceof ZodError) {
    let errors = [];
    for (const issue of error.issues) {
      if (issue.path[0] !== undefined)
        errors.push({ property: issue.path[0], message: issue.message });
      else errors.push({ message: "Content-Type must be application/json" });
    }
    // console.log(errors);
    return { status: 400, errors: errors };
  }
  return null;
}

module.exports = handleZodError;

// Small HTTP helpers shared by every route module.

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const unauthorized = (message = "Authentication required") => new HttpError(401, message);
export const forbidden = (message = "Not allowed") => new HttpError(403, message);
export const notFound = (message = "Not found") => new HttpError(404, message);
export const tooLarge = (message = "Payload too large") => new HttpError(413, message);

// Wraps an async handler so rejected promises reach the error middleware.
export const route = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// Validates with a Zod schema and turns failures into a 400 with field details.
export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw badRequest("Validation failed", result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    })));
  }
  return result.data;
}

export function parseQuery(schema, query) {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw badRequest("Invalid query parameters", result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    })));
  }
  return result.data;
}

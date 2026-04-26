import crypto from "crypto";

/**
 * Attach a unique request ID to every incoming request.
 * - Honors `X-Request-Id` header from upstream load balancers
 * - Echoes the ID back in the response so clients can correlate
 *
 * Use `req.id` or `res.getHeader('X-Request-Id')` in logs.
 */
export function requestId(req, res, next) {
  const incoming = req.headers["x-request-id"];
  const id = (typeof incoming === "string" && incoming.length <= 100)
    ? incoming
    : crypto.randomBytes(8).toString("hex");
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

export const success = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const created = (res, data = null, message = "Created successfully") => {
  return success(res, data, message, 201);
};

/**
 * Sends a standardized error response.
 *
 * In production, 5xx errors return a generic message so we never leak DB
 * internals, stack frames, or PII in `err.message`. The original message is
 * still logged server-side and the request-id (set by requestId middleware)
 * is echoed back so support can correlate.
 *
 * 4xx messages (validation, not-found, etc.) are safe and pass through.
 */
export const error = (res, message = "Internal server error", statusCode = 500, errors = null) => {
  const isServerError = statusCode >= 500;
  const isProd = process.env.NODE_ENV === "production";

  if (isServerError) {
    // Always log server-side
    const reqId = res.getHeader && res.getHeader("X-Request-Id");
    console.error(`[ERROR ${statusCode}]${reqId ? ` reqId=${reqId}` : ""} ${message}`);
  }

  const safeMessage = isServerError && isProd
    ? "Something went wrong. Please try again or contact support."
    : message;

  const payload = { success: false, message: safeMessage };
  if (errors) payload.errors = errors;
  if (isServerError) {
    const reqId = res.getHeader && res.getHeader("X-Request-Id");
    if (reqId) payload.requestId = reqId;
  }
  return res.status(statusCode).json(payload);
};

export const badRequest = (res, message = "Bad request", errors = null) => {
  return error(res, message, 400, errors);
};

export const unauthorized = (res, message = "Unauthorized") => {
  return error(res, message, 401);
};

export const forbidden = (res, message = "Forbidden") => {
  return error(res, message, 403);
};

export const notFound = (res, message = "Resource not found") => {
  return error(res, message, 404);
};

export const paginated = (res, data, total, page, limit, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

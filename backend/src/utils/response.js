export const success = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const created = (res, data = null, message = "Created successfully") => {
  return success(res, data, message, 201);
};

export const error = (res, message = "Internal server error", statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
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

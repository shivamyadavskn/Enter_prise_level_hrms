/**
 * Shared query helpers — keeps controllers DRY and prevents bugs.
 */

/**
 * Build org-scoped Prisma `where` filter.
 * Usage:
 *   const where = withOrgScope(req, { isActive: true })
 *   const where = withOrgScope(req, { status: "PENDING" }, { via: "employee" })
 */
export function withOrgScope(req, where = {}, opts = {}) {
  if (!req.organisationId) return where;
  const { direct = true, via = null } = opts;
  if (via) {
    where[via] = { ...(where[via] || {}), organisationId: req.organisationId };
    return where;
  }
  if (direct) where.organisationId = req.organisationId;
  return where;
}

/**
 * Validate & clamp pagination params from req.query.
 */
export function getPagination(req, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(req.query.limit) || defaultLimit));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Strip a list of forbidden fields from a request body.
 */
export function stripFields(body = {}, forbidden = []) {
  const out = { ...body };
  for (const f of forbidden) delete out[f];
  return out;
}

/**
 * Coerce a query-string boolean to actual boolean.
 */
export function toBool(v) {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  return v === "true" || v === "1" || v === 1;
}

import redis from "./redis.js";

/**
 * Account lockout backed by Redis.
 *  - 5 failed attempts within 15 min -> lock account for 15 min
 *  - Successful login resets the counter
 */

const FAIL_KEY = (email) => `auth:fail:${String(email).toLowerCase()}`;
const LOCK_KEY = (email) => `auth:lock:${String(email).toLowerCase()}`;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60;     // 15 min
const LOCKOUT_DURATION = 15 * 60;   // 15 min

export async function isLockedOut(email) {
  const v = await redis.get(LOCK_KEY(email));
  return v === "1";
}

export async function recordFailedLogin(email) {
  const key = FAIL_KEY(email);
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, ATTEMPT_WINDOW);
  if (count >= MAX_ATTEMPTS) {
    await redis.setex(LOCK_KEY(email), LOCKOUT_DURATION, "1");
    await redis.del(key);
    return { locked: true, count };
  }
  return { locked: false, count, remaining: MAX_ATTEMPTS - count };
}

export async function clearFailedLogins(email) {
  await redis.del(FAIL_KEY(email));
  await redis.del(LOCK_KEY(email));
}

/**
 * Password policy: min 8 chars, must include upper, lower, digit, symbol.
 * Returns { ok: boolean, errors: string[] }.
 */
export function validatePasswordPolicy(password) {
  const errors = [];
  if (!password || password.length < 8) errors.push("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain a lowercase letter");
  if (!/\d/.test(password))    errors.push("Password must contain a digit");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password must contain a symbol");
  return { ok: errors.length === 0, errors };
}

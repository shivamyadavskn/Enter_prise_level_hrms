import crypto from "crypto";

/**
 * AES-256-GCM authenticated encryption for PII fields at rest.
 *
 * Uses ENCRYPTION_KEY env var (32 bytes hex = 64 chars).
 * Generate: `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`
 *
 * Output format: `<iv_hex>:<ciphertext_hex>:<auth_tag_hex>`
 * Returns plaintext unchanged if no ENCRYPTION_KEY is set (dev fallback).
 */
const KEY_HEX = process.env.ENCRYPTION_KEY || "";
const IV_LEN = 12;
const ALGO = "aes-256-gcm";

const getKey = () => {
  if (!KEY_HEX) return null;
  if (KEY_HEX.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes hex (64 chars).");
  }
  return Buffer.from(KEY_HEX, "hex");
};

export function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === "") return plaintext;
  const key = getKey();
  if (!key) return String(plaintext);

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${enc.toString("hex")}:${tag.toString("hex")}`;
}

export function decrypt(payload) {
  if (!payload) return payload;
  const key = getKey();
  if (!key) return payload;

  const parts = String(payload).split(":");
  if (parts.length !== 3) return payload;

  try {
    const [ivHex, encHex, tagHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const enc = Buffer.from(encHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return payload;
  }
}

export function mask(value, visibleStart = 2, visibleEnd = 4) {
  if (!value) return value;
  const s = String(value);
  if (s.length <= visibleStart + visibleEnd) return "*".repeat(s.length);
  return s.slice(0, visibleStart) + "*".repeat(s.length - visibleStart - visibleEnd) + s.slice(-visibleEnd);
}

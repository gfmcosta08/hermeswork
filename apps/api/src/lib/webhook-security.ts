import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env.js";

export function isTimestampValid(timestampHeader: string, maxWindowMs = 5 * 60 * 1000): boolean {
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) return false;
  const now = Date.now();
  return Math.abs(now - ts) <= maxWindowMs;
}

export function signBody(payload: unknown, timestamp: string): string {
  const normalized = JSON.stringify(payload);
  return createHmac("sha256", env.WEBHOOK_HMAC_SECRET)
    .update(`${timestamp}.${normalized}`)
    .digest("hex");
}

export function verifySignature(payload: unknown, timestamp: string, signature: string): boolean {
  const expected = signBody(payload, timestamp);

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

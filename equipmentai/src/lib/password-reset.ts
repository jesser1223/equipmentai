import { createHash, randomBytes } from "crypto";

const RESET_TTL_MS = 30 * 60 * 1000;
const MAX_REQUESTS = 3;
const WINDOW_MS = 15 * 60 * 1000;

export function generateResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function resetExpiry(now = Date.now()) {
  return new Date(now + RESET_TTL_MS);
}

export function isWithinRateLimit(recentCount: number) {
  return recentCount < MAX_REQUESTS;
}

export function rateWindowStart(now = Date.now()) {
  return new Date(now - WINDOW_MS);
}

export function validatePassword(password: string) {
  if (!password || password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include a letter and a number.";
  }
  return null;
}

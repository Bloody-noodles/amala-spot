import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "amala_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}
function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret().length >= 32);
}
export function createAdminSession() {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const payload = issuedAt;
  return `${payload}.${signature(payload)}`;
}
export function isAdminRequest(request: NextRequest) {
  if (!adminConfigured()) return false;
  const token = request.cookies.get(COOKIE_NAME)?.value || "";
  const [issuedAt, supplied] = token.split(".");
  if (!issuedAt || !supplied || !/^\d+$/.test(issuedAt)) return false;
  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  if (age < 0 || age > SESSION_SECONDS) return false;
  const expected = signature(issuedAt);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function adminCookieOptions() {
  return { name: COOKIE_NAME, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/admin", maxAge: SESSION_SECONDS };
}
export function checkAdminPassword(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function clearAdminCookieOptions() {
  return { ...adminCookieOptions(), maxAge: 0 };
}
export function getSupabaseAdminConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");
  return { url, key };
}
export function supabaseAdminHeaders(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, adminCookieOptions, checkAdminPassword, createAdminSession, hasSafeRequestOrigin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!hasSafeRequestOrigin(request)) return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  if (!adminConfigured()) return NextResponse.json({ error: "Admin access is not configured yet. Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET to the production environment." }, { status: 503 });
  let password = "";
  try { password = String((await request.json()).password || ""); } catch { return NextResponse.json({ error: "Enter the admin password." }, { status: 400 }); }
  if (!checkAdminPassword(password)) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ ...adminCookieOptions(), value: createAdminSession() });
  return response;
}
export async function DELETE(request: NextRequest) {
  if (!hasSafeRequestOrigin(request)) return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ ...adminCookieOptions(), value: "", maxAge: 0 });
  return response;
}

import { NextResponse, type NextRequest } from "next/server";

// Lightweight single-admin gate: the session cookie is simply the admin
// password itself, set HttpOnly+Secure at login. That's an appropriate
// level of protection for a small internal tool behind HTTPS — if this
// grows beyond one person, switch to real auth (e.g. Supabase Auth).
export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const sessionCookie = request.cookies.get("admin_session")?.value;
  const expected = process.env.ADMIN_PASSWORD;
  const isAuthed = Boolean(expected) && sessionCookie === expected;

  if (isLoginPage) {
    if (isAuthed) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (!isAuthed) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

import { cookies } from "next/headers";

export function isAdminRequest(): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return cookies().get("admin_session")?.value === expected;
}

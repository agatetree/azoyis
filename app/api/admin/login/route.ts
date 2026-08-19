import { NextResponse } from "next/server";
import { adminAuthConfigured, createAdminSession, validateAdminCredentials } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!(await adminAuthConfigured())) return NextResponse.json({ error: "Administrator login has not been configured yet." }, { status: 503 });
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!(await validateAdminCredentials(email, password))) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  await createAdminSession(email);
  return NextResponse.json({ ok: true });
}

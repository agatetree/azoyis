import { NextResponse } from "next/server";
import {
  adminAuthConfigured,
  createAdminAccount,
  createAdminSession,
  mayCreateAdmin,
} from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (await adminAuthConfigured()) {
    return NextResponse.json({ error: "Administrator access is already configured." }, { status: 409 });
  }
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown; setupKey?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const setupKey = typeof body?.setupKey === "string" ? body.setupKey : "";
  if (!(await mayCreateAdmin(email, setupKey))) {
    return NextResponse.json({ error: "The owner email or setup key is incorrect." }, { status: 403 });
  }
  try {
    await createAdminAccount(email, password);
    await createAdminSession(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Administrator access could not be created." }, { status: 400 });
  }
}

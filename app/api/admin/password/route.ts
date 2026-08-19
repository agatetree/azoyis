import { NextResponse } from "next/server";
import { changeAdminPassword, isAdminAuthenticated } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    currentPassword?: unknown;
    newPassword?: unknown;
  } | null;
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Complete every password field." }, { status: 400 });
  }
  try {
    await changeAdminPassword(currentPassword, newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The password could not be changed." },
      { status: 400 },
    );
  }
}

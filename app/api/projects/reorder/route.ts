import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/admin-auth";
import { reorderProjects } from "../../../../lib/project-store";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  if (!Array.isArray(body?.ids) || !body.ids.every((id) => Number.isInteger(id) && Number(id) > 0)) return NextResponse.json({ error: "Invalid project order." }, { status: 400 });
  await reorderProjects(body.ids as number[]);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/admin-auth";
import { deleteProject, normalizeProjectInput, updateProject } from "../../../../lib/project-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const id = Number((await context.params).id);
  const input = normalizeProjectInput(await request.json().catch(() => null));
  if (!Number.isInteger(id) || id < 1 || !input) return NextResponse.json({ error: "Please check the project details." }, { status: 400 });
  const project = await updateProject(id, input);
  return project ? NextResponse.json({ project }) : NextResponse.json({ error: "Project not found." }, { status: 404 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  await deleteProject(id);
  return NextResponse.json({ ok: true });
}

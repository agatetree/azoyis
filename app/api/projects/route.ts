import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { createProject, listProjects, normalizeProjectInput } from "../../../lib/project-store";

export async function GET(request: Request) {
  const includeAll = new URL(request.url).searchParams.get("all") === "1";
  if (includeAll && !(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ projects: await listProjects({ publishedOnly: !includeAll }) });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const input = normalizeProjectInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "Please check the project details." }, { status: 400 });
  return NextResponse.json({ project: await createProject(input) }, { status: 201 });
}

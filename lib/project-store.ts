import postgres from "postgres";
import { getRuntimeEnv } from "./runtime-env";

export type ProjectStatus = "Published" | "Hidden";
export type ProjectAccess = "Public" | "Private";
export type Project = {
  id: number;
  name: string;
  category: string;
  description: string;
  url: string;
  status: ProjectStatus;
  access: ProjectAccess;
  mark: string;
  sortOrder: number;
};
export type ProjectInput = Omit<Project, "id" | "sortOrder">;

export const fallbackProjects: Project[] = [
  { id: 1, name: "L’Chaim", category: "Public resource", description: "Kosher products, trusted information, and useful everyday resources in one clear place.", url: "/lchaim", status: "Published", access: "Public", mark: "L’", sortOrder: 0 },
  { id: 2, name: "Cartiro", category: "Public tool", description: "A practical digital tool built to make everyday information easier to use.", url: "https://cartiro.app", status: "Published", access: "Public", mark: "CA", sortOrder: 1 },
  { id: 3, name: "Tzadikim Yahrtzeit", category: "Public resource", description: "Yahrtzeit dates, stories, and the enduring legacies of tzadikim.", url: "", status: "Published", access: "Public", mark: "TY", sortOrder: 2 },
  { id: 4, name: "Lenders Radar", category: "AI intelligence platform", description: "A private lending intelligence platform built for focused research and faster decisions.", url: "", status: "Published", access: "Private", mark: "LR", sortOrder: 3 },
];

type ProjectRow = Omit<Project, "sortOrder"> & { sort_order: number };

declare global {
  var __azoyisSql: ReturnType<typeof postgres> | undefined;
}

export function database() {
  const url = getRuntimeEnv().POSTGRES_URL;
  if (!url) throw new Error("POSTGRES_URL is not configured.");
  if (!globalThis.__azoyisSql) globalThis.__azoyisSql = postgres(url, { max: 1, prepare: false });
  return globalThis.__azoyisSql;
}

async function ensureProjectsTable() {
  const sql = database();
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Published' CHECK(status IN ('Published', 'Hidden')),
    access TEXT NOT NULL DEFAULT 'Public' CHECK(access IN ('Public', 'Private')),
    mark TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await sql.unsafe("CREATE INDEX IF NOT EXISTS projects_sort_order_idx ON projects (sort_order)");
  const [count] = await sql<{ total: number }[]>`SELECT COUNT(*)::int AS total FROM projects`;
  if (Number(count?.total ?? 0) === 0) {
    const now = new Date();
    for (const project of fallbackProjects) {
      await sql`INSERT INTO projects (name, category, description, url, status, access, mark, sort_order, created_at, updated_at)
        VALUES (${project.name}, ${project.category}, ${project.description}, ${project.url}, ${project.status}, ${project.access}, ${project.mark}, ${project.sortOrder}, ${now}, ${now})`;
    }
  }
}

function mapProject(row: ProjectRow): Project {
  return { id: Number(row.id), name: row.name, category: row.category, description: row.description, url: row.url, status: row.status, access: row.access, mark: row.mark, sortOrder: Number(row.sort_order) };
}

export async function listProjects(options: { publishedOnly?: boolean } = {}) {
  await ensureProjectsTable();
  const sql = database();
  const rows = options.publishedOnly
    ? await sql<ProjectRow[]>`SELECT id, name, category, description, url, status, access, mark, sort_order FROM projects WHERE status = 'Published' ORDER BY sort_order, id`
    : await sql<ProjectRow[]>`SELECT id, name, category, description, url, status, access, mark, sort_order FROM projects ORDER BY sort_order, id`;
  return rows.map(mapProject);
}

export async function getProject(id: number) {
  await ensureProjectsTable();
  const [row] = await database()<ProjectRow[]>`SELECT id, name, category, description, url, status, access, mark, sort_order FROM projects WHERE id = ${id}`;
  return row ? mapProject(row) : null;
}

export async function createProject(input: ProjectInput) {
  await ensureProjectsTable();
  const sql = database();
  const [order] = await sql<{ next_order: number }[]>`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM projects`;
  const now = new Date();
  const [created] = await sql<{ id: number }[]>`INSERT INTO projects (name, category, description, url, status, access, mark, sort_order, created_at, updated_at)
    VALUES (${input.name}, ${input.category}, ${input.description}, ${input.url}, ${input.status}, ${input.access}, ${input.mark}, ${Number(order?.next_order ?? 0)}, ${now}, ${now}) RETURNING id`;
  return getProject(Number(created.id));
}

export async function updateProject(id: number, input: ProjectInput) {
  await ensureProjectsTable();
  await database()`UPDATE projects SET name = ${input.name}, category = ${input.category}, description = ${input.description}, url = ${input.url}, status = ${input.status}, access = ${input.access}, mark = ${input.mark}, updated_at = ${new Date()} WHERE id = ${id}`;
  return getProject(id);
}

export async function deleteProject(id: number) {
  await ensureProjectsTable();
  await database()`DELETE FROM projects WHERE id = ${id}`;
  const remaining = await listProjects();
  await reorderProjects(remaining.map((project) => project.id));
}

export async function reorderProjects(ids: number[]) {
  await ensureProjectsTable();
  const sql = database();
  for (let index = 0; index < ids.length; index += 1) {
    await sql`UPDATE projects SET sort_order = ${index}, updated_at = ${new Date()} WHERE id = ${ids[index]}`;
  }
}

export function normalizeProjectInput(value: unknown): ProjectInput | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = String(record.name ?? "").trim();
  const category = String(record.category ?? "").trim();
  const description = String(record.description ?? "").trim();
  const url = String(record.url ?? "").trim();
  const status: ProjectStatus = record.status === "Hidden" ? "Hidden" : "Published";
  const access: ProjectAccess = record.access === "Private" ? "Private" : "Public";
  const mark = String(record.mark ?? "").trim().slice(0, 8);
  if (!name || !description || name.length > 100 || description.length > 500 || category.length > 80 || url.length > 300) return null;
  if (url && !url.startsWith("/")) {
    try { if (!["http:", "https:"].includes(new URL(url).protocol)) return null; }
    catch { return null; }
  }
  // Root-relative paths ("/lchaim") are allowed so in-site projects can be
  // linked without hardcoding the public domain. Reject protocol-relative
  // ("//evil.com") and any backslash form, which would leave the site.
  if (url.startsWith("//") || url.includes("\\")) return null;
  return { name, category, description, url, status, access, mark };
}

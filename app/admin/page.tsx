import { requireAdmin } from "../../lib/admin-auth";
import { listProjects } from "../../lib/project-store";
import { getRuntimeEnv } from "../../lib/runtime-env";
import ProjectsAdmin from "./projects-admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const projects = await listProjects();
  const contactReady = /^\S+@\S+\.\S+$/.test(getRuntimeEnv().CONTACT_TO_EMAIL ?? "");
  return <ProjectsAdmin initialProjects={projects} contactReady={contactReady} />;
}

import { redirect } from "next/navigation";
import { adminAuthConfigured } from "../../../lib/admin-auth";
import AdminSetupForm from "./setup-form";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  if (await adminAuthConfigured()) redirect("/admin/login");
  return <AdminSetupForm />;
}

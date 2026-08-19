import { redirect } from "next/navigation";
import { adminAuthConfigured } from "../../../lib/admin-auth";
import AdminLoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!(await adminAuthConfigured())) redirect("/admin/setup");
  return <AdminLoginForm />;
}

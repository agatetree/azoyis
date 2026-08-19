"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Project } from "../../lib/project-store";

type ProjectFilter = "all" | "published" | "hidden" | "private";

const blankProject: Project = {
  id: 0,
  name: "",
  category: "",
  description: "",
  url: "",
  status: "Published",
  access: "Public",
  mark: "",
  sortOrder: 0,
};

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (response.status === 401) {
    window.location.assign("/admin/login");
    throw new Error("Your session expired.");
  }
  if (!response.ok) throw new Error(data?.error ?? "Something went wrong.");
  return data as T;
}

export default function ProjectsAdmin({
  initialProjects,
  contactReady,
}: {
  initialProjects: Project[];
  contactReady: boolean;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [editorOpen, setEditorOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [draft, setDraft] = useState<Project>(blankProject);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const filteredProjects = useMemo(() => {
    const term = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesTerm = !term || `${project.name} ${project.category} ${project.description}`.toLowerCase().includes(term);
      const matchesStatus = filter === "all"
        || (filter === "published" && project.status === "Published")
        || (filter === "hidden" && project.status === "Hidden")
        || (filter === "private" && project.access === "Private");
      return matchesTerm && matchesStatus;
    });
  }, [filter, projects, query]);

  function openAdd() {
    setDraft({ ...blankProject });
    setEditorOpen(true);
    setNotice("");
  }

  function openEdit(project: Project) {
    setDraft({ ...project });
    setEditorOpen(true);
    setNotice("");
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const exists = draft.id > 0;
      const result = await api<{ project: Project }>(exists ? `/api/projects/${draft.id}` : "/api/projects", {
        method: exists ? "PUT" : "POST",
        body: JSON.stringify(draft),
      });
      setProjects((current) => exists
        ? current.map((project) => project.id === result.project.id ? result.project : project)
        : [...current, result.project]);
      setEditorOpen(false);
      setNotice(exists ? "Project updated." : "Project added.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The project could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function removeProject() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
      setProjects((current) => current.filter((project) => project.id !== deleteTarget.id));
      setEditorOpen(false);
      setDeleteTarget(null);
      setNotice("Project removed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The project could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(project: Project) {
    if (busy) return;
    const nextStatus: Project["status"] = project.status === "Published" ? "Hidden" : "Published";
    setBusy(true);
    try {
      const result = await api<{ project: Project }>(`/api/projects/${project.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...project, status: nextStatus }),
      });
      setProjects((current) => current.map((item) => item.id === project.id ? result.project : item));
      setNotice(nextStatus === "Published" ? `${project.name} is now published.` : `${project.name} is now hidden.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Visibility could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function moveProject(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= projects.length || busy) return;
    const previous = projects;
    const next = [...projects];
    [next[index], next[target]] = [next[target], next[index]];
    setProjects(next);
    setBusy(true);
    try {
      await api("/api/projects/reorder", { method: "POST", body: JSON.stringify({ ids: next.map((project) => project.id) }) });
      setNotice("Project order updated.");
    } catch (error) {
      setProjects(previous);
      setNotice(error instanceof Error ? error.message : "The order could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      setNotice("The new passwords do not match.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await api("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      form.reset();
      setSecurityOpen(false);
      setNotice("Password changed successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The password could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await api("/api/admin/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/" aria-label="Back to AzoyIs homepage"><img src="/logo.png" alt="AzoyIs" /></Link>
        <p className="admin-label">Private admin</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          <a className="active" href="#projects"><span aria-hidden="true">▦</span> Projects</a>
          <button type="button" onClick={() => setSecurityOpen(true)}><span aria-hidden="true">⌁</span> Security</button>
          <Link href="/"><span aria-hidden="true">↗</span> View website</Link>
        </nav>
        <div className="admin-user">
          <div aria-hidden="true">AZ</div>
          <span><strong>AzoyIs Admin</strong><small>Owner access</small></span>
          <button className="admin-logout" type="button" onClick={signOut}>Sign out</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><p className="admin-kicker">Website manager</p><h1>Projects</h1><p>Add, edit, organize, publish, or hide projects from one place.</p></div>
          <button className="admin-add" type="button" onClick={openAdd}><span aria-hidden="true">＋</span> Add project</button>
        </header>

        <section className="admin-summary" aria-label="Website summary">
          <div><span>Total projects</span><strong>{projects.length}</strong></div>
          <div><span>Published</span><strong>{projects.filter((project) => project.status === "Published").length}</strong></div>
          <div><span>Private previews</span><strong>{projects.filter((project) => project.access === "Private").length}</strong></div>
          <div className="admin-health"><span>Contact form</span><strong className={contactReady ? "ready" : "attention"}>{contactReady ? "Ready" : "Needs setup"}</strong></div>
        </section>

        <section className="admin-projects" id="projects" aria-labelledby="project-list-title">
          <div className="admin-section-heading">
            <div><h2 id="project-list-title">Homepage projects</h2><p>Search, edit, change visibility, or use the arrows to control the order.</p></div>
            <span>{filteredProjects.length} shown</span>
          </div>
          <div className="admin-tools">
            <label><span className="sr-only">Search projects</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects…" /></label>
            <label><span className="sr-only">Filter projects</span><select value={filter} onChange={(event) => setFilter(event.target.value as ProjectFilter)}><option value="all">All projects</option><option value="published">Published</option><option value="hidden">Hidden</option><option value="private">Private previews</option></select></label>
          </div>
          {notice && <p className="admin-notice" role="status">{notice}</p>}
          <div className="admin-list">
            {filteredProjects.map((project) => {
              const index = projects.findIndex((item) => item.id === project.id);
              return (
                <article className="admin-project-row" key={project.id}>
                  <div className="admin-reorder">
                    <button type="button" onClick={() => moveProject(index, -1)} disabled={index === 0 || busy} aria-label={`Move ${project.name} up`}>↑</button>
                    <button type="button" onClick={() => moveProject(index, 1)} disabled={index === projects.length - 1 || busy} aria-label={`Move ${project.name} down`}>↓</button>
                  </div>
                  <div className="admin-project-mark" aria-hidden="true">{project.mark || project.name.slice(0, 2).toUpperCase()}</div>
                  <div className="admin-project-copy">
                    <button className="admin-project-name" type="button" onClick={() => openEdit(project)}>{project.name} <span aria-hidden="true">↗</span></button>
                    <p>{project.description}</p><small>{project.category || "No category"}</small>
                  </div>
                  <button className={`admin-status ${project.status === "Hidden" ? "hidden" : ""}`} type="button" onClick={() => toggleVisibility(project)} disabled={busy} title={project.status === "Published" ? "Click to hide" : "Click to publish"}><i aria-hidden="true" /> {project.status} · {project.access}</button>
                  <button className="admin-edit" type="button" onClick={() => openEdit(project)}>Edit</button>
                </article>
              );
            })}
            {filteredProjects.length === 0 && <div className="admin-empty"><strong>{projects.length ? "No matching projects" : "No projects yet"}</strong><p>{projects.length ? "Try another search or filter." : "Add your first project to show it on the homepage."}</p>{!projects.length && <button className="admin-add" type="button" onClick={openAdd}>Add project</button>}</div>}
          </div>
        </section>
      </main>

      {editorOpen && (
        <div className="admin-editor-wrap" role="dialog" aria-modal="true" aria-labelledby="editor-title">
          <button className="admin-editor-shade" type="button" onClick={() => setEditorOpen(false)} aria-label="Close editor" />
          <form className="admin-editor" onSubmit={saveProject}>
            <div className="admin-editor-head">
              <div><p className="admin-kicker">Project details</p><h2 id="editor-title">{draft.id ? "Edit project" : "Add project"}</h2></div>
              <button type="button" onClick={() => setEditorOpen(false)} aria-label="Close editor">×</button>
            </div>
            <div className="admin-logo-field">
              <div>{draft.mark || draft.name.slice(0, 2).toUpperCase() || "AZ"}</div>
              <label><span>Temporary initials</span><input type="text" value={draft.mark} maxLength={8} onChange={(event) => setDraft({ ...draft, mark: event.target.value })} placeholder="Example: AE" /></label>
              <small>Used until a final project image is added later.</small>
            </div>
            <label><span>Project name</span><input type="text" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Project name" required /></label>
            <label><span>Website address</span><input type="url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://project.azoyis.com" /><small>The address stays hidden. Visitors click the project button.</small></label>
            <label><span>Short description</span><textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="What does this project help people do?" required /></label>
            <div className="admin-field-row">
              <label><span>Category</span><input type="text" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="AI agent, tool, system…" /></label>
              <label><span>Visibility</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Project["status"] })}><option>Published</option><option>Hidden</option></select></label>
            </div>
            <label><span>Project access</span><select value={draft.access} onChange={(event) => setDraft({ ...draft, access: event.target.value as Project["access"] })}><option>Public</option><option>Private</option></select><small>Private projects show only a preview and never expose their website address.</small></label>
            <div className="admin-editor-actions">
              {draft.id > 0 && <button className="admin-remove" type="button" disabled={busy} onClick={() => setDeleteTarget(draft)}>Remove project</button>}
              <div><button className="admin-cancel" type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button className="admin-save" type="submit" disabled={busy}>{busy ? "Saving…" : "Save project"}</button></div>
            </div>
          </form>
        </div>
      )}

      {securityOpen && (
        <div className="admin-editor-wrap" role="dialog" aria-modal="true" aria-labelledby="security-title">
          <button className="admin-editor-shade" type="button" onClick={() => setSecurityOpen(false)} aria-label="Close security settings" />
          <form className="admin-editor admin-security-panel" onSubmit={changePassword}>
            <div className="admin-editor-head">
              <div><p className="admin-kicker">Account security</p><h2 id="security-title">Change password</h2></div>
              <button type="button" onClick={() => setSecurityOpen(false)} aria-label="Close security settings">×</button>
            </div>
            <p className="admin-security-copy">Use your current password to create a new one. Passwords are securely hashed and are never visible in the website code.</p>
            <label><span>Current password</span><input type="password" name="currentPassword" autoComplete="current-password" required /></label>
            <label><span>New password</span><input type="password" name="newPassword" autoComplete="new-password" minLength={10} required /><small>Use at least 10 characters.</small></label>
            <label><span>Confirm new password</span><input type="password" name="confirmPassword" autoComplete="new-password" minLength={10} required /></label>
            <div className="admin-editor-actions"><div><button className="admin-cancel" type="button" onClick={() => setSecurityOpen(false)}>Cancel</button><button className="admin-save" type="submit" disabled={busy}>{busy ? "Changing…" : "Change password"}</button></div></div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-confirm-wrap" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <button className="admin-editor-shade" type="button" onClick={() => setDeleteTarget(null)} aria-label="Cancel removal" />
          <div className="admin-confirm">
            <span aria-hidden="true">!</span>
            <h2 id="delete-title">Remove {deleteTarget.name}?</h2>
            <p>This removes the project from the admin and homepage. This cannot be undone.</p>
            <div><button className="admin-cancel" type="button" onClick={() => setDeleteTarget(null)}>Keep project</button><button className="admin-delete-confirm" type="button" disabled={busy} onClick={removeProject}>{busy ? "Removing…" : "Remove project"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

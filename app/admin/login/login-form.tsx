"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;
    if (response?.ok) {
      window.location.assign("/admin");
      return;
    }
    setNotice(result?.error ?? "Sign in could not be completed. Please try again.");
    setBusy(false);
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="AzoyIs administration">
        <div className="login-grid" aria-hidden="true" />
        <Link className="login-panel-logo" href="/" aria-label="AzoyIs homepage"><img src="/favicon.png" alt="" /></Link>
        <div className="login-brand-copy">
          <p>AzoyIs Admin</p>
          <h1>Your projects,<br />organized in one place.</h1>
          <span>Manage what visitors see on your website.</span>
        </div>
        <div className="login-panel-foot"><span className="login-status-dot" aria-hidden="true" />Private administrator area</div>
      </section>

      <section className="login-form-side">
        <div className="login-mobile-brand"><Link href="/" aria-label="AzoyIs homepage"><img src="/logo.png" alt="AzoyIs" /></Link></div>
        <div className="login-card">
          <Link className="login-back" href="/"><span aria-hidden="true">←</span> Back to website</Link>
          <div className="login-heading"><p>Private access</p><h2>Admin sign in</h2><span>Sign in to manage your AzoyIs projects.</span></div>
          <form className="login-form" onSubmit={handleSubmit}>
            <label><span>Email address</span><input type="email" name="email" autoComplete="username" placeholder="Enter your email" required /></label>
            <label>
              <span>Password</span>
              <span className="login-password-field">
                <input type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="Enter your password" required />
                <button type="button" className="login-show-password" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
              </span>
            </label>
            <button className="login-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span></button>
            {notice && <p className="login-notice" role="status">{notice}</p>}
          </form>
          <div className="login-security">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z" /></svg>
            <span>This area is protected by secure authentication.</span>
          </div>
        </div>
        <p className="login-copyright">© {new Date().getFullYear()} AzoyIs</p>
      </section>
    </main>
  );
}

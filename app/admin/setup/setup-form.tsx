"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminSetupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setNotice("The passwords do not match.");
      setBusy(false);
      return;
    }
    const response = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), setupKey: form.get("setupKey"), password }),
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;
    if (!response?.ok) {
      setNotice(result?.error ?? "Administrator access could not be created.");
      setBusy(false);
      return;
    }
    window.location.assign("/admin");
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="AzoyIs administration">
        <div className="login-grid" aria-hidden="true" />
        <Link className="login-panel-logo" href="/" aria-label="AzoyIs homepage"><img src="/favicon.png" alt="" /></Link>
        <div className="login-brand-copy"><p>AzoyIs Admin</p><h1>One private place<br />to manage it all.</h1><span>Create your administrator login once. Your password is never stored in the website code.</span></div>
        <div className="login-panel-foot"><span className="login-status-dot" aria-hidden="true" />Owner-only setup</div>
      </section>
      <section className="login-form-side">
        <div className="login-card">
          <Link className="login-back" href="/"><span aria-hidden="true">←</span> Back to website</Link>
          <div className="login-heading"><p>First-time setup</p><h2>Create admin login</h2><span>Choose the email and password you will use.</span></div>
          <form className="login-form" onSubmit={submit}>
            <label><span>Email address</span><input type="email" name="email" autoComplete="username" placeholder="Enter your email" required /></label>
            <label><span>Private setup key</span><input type="password" name="setupKey" autoComplete="off" placeholder="Enter the key from Vercel settings" required /></label>
            <label><span>Password</span><span className="login-password-field"><input type={showPassword ? "text" : "password"} name="password" autoComplete="new-password" placeholder="At least 10 characters" minLength={10} required /><button type="button" className="login-show-password" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "Hide" : "Show"}</button></span></label>
            <label><span>Confirm password</span><input type={showPassword ? "text" : "password"} name="confirmPassword" autoComplete="new-password" placeholder="Enter it again" minLength={10} required /></label>
            <button className="login-submit" type="submit" disabled={busy}>{busy ? "Creating…" : "Create secure login"}<span aria-hidden="true">→</span></button>
            {notice && <p className="login-notice" role="status">{notice}</p>}
          </form>
          <div className="login-security"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z" /></svg><span>Your password is salted and securely hashed before storage.</span></div>
        </div>
      </section>
    </main>
  );
}

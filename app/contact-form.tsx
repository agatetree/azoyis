"use client";

import { useState } from "react";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("");
    const form = event.currentTarget;
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;
    if (!response?.ok) {
      setState("error");
      setMessage(result?.error ?? "Your message could not be sent. Please try again.");
      return;
    }
    form.reset();
    setState("sent");
    setMessage("Thank you. Your message was sent.");
  }

  return (
    <form onSubmit={submit}>
      <input className="honey" type="text" name="website" tabIndex={-1} autoComplete="off" />
      <div className="field-row">
        <label><span>Name</span><input type="text" name="name" autoComplete="name" placeholder="Your name" required /></label>
        <label><span>Email</span><input type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label>
      </div>
      <label><span>What would you like to build?</span><textarea name="message" rows={5} placeholder="Tell me about the problem, idea, or process you want to improve." required /></label>
      <button className="button button-primary form-submit" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"} <span aria-hidden="true">↗</span>
      </button>
      <p className="form-privacy">Your email is used only to reply to your message.</p>
      {message && <p className={`form-message ${state}`} role="status">{message}</p>}
    </form>
  );
}

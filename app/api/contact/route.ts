import { NextResponse } from "next/server";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

function runtimeValue(name: string) {
  const value = (getRuntimeEnv() as Record<string, unknown>)[name];
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (String(body.website ?? "").trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) {
    return NextResponse.json(
      { error: "Please complete every field." },
      { status: 400 }
    );
  }

  if (name.length > 100 || email.length > 200 || message.length > 3000) {
    return NextResponse.json(
      { error: "Your message is too long." },
      { status: 400 }
    );
  }

  const recipient = runtimeValue("CONTACT_TO_EMAIL");
  const apiKey = process.env.RESEND_API_KEY;

  if (!/^\S+@\S+\.\S+$/.test(recipient) || !apiKey) {
    return NextResponse.json(
      { error: "The contact form is not configured yet." },
      { status: 503 }
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AzoyIs Website <contact@azoyis.com>",
      to: [recipient],
      reply_to: email,
      subject: `New AzoyIs message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    }),
  });

  if (!response.ok) {
    console.error("Contact delivery failed", {
      status: response.status,
      details: await response.text().catch(() => ""),
    });
  }

  return response.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json(
        { error: "Your message could not be sent. Please try again." },
        { status: 502 }
      );
}

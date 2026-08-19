import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { database } from "./project-store";
import { getRuntimeEnv } from "./runtime-env";

const COOKIE_NAME = "azoyis_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;
const PASSWORD_ITERATIONS = 210_000;

type AdminRow = {
  email: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
};

async function ensureAdminTable() {
  await database().unsafe(`CREATE TABLE IF NOT EXISTS admin_credentials (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_iterations INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
}

function toBase64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
}

function fromBase64Url(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

async function equalSecret(left: string, right: string) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return difference === 0;
}

async function passwordHash(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations }, key, 256);
  return toBase64Url(new Uint8Array(bits));
}

async function sign(value: string) {
  const secret = getRuntimeEnv().ADMIN_SESSION_SECRET ?? "";
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

export async function adminAuthConfigured() {
  try {
    await ensureAdminTable();
    const [row] = await database()<Array<{ id: number }>>`SELECT id FROM admin_credentials WHERE id = 1`;
    return Boolean(row?.id && getRuntimeEnv().ADMIN_SESSION_SECRET);
  } catch {
    return false;
  }
}

export async function mayCreateAdmin(email: string, setupKey: string) {
  const configuredEmail = getRuntimeEnv().ADMIN_SETUP_EMAIL?.trim().toLowerCase() ?? "";
  const configuredKey = getRuntimeEnv().ADMIN_SETUP_KEY ?? "";
  return Boolean(configuredEmail && configuredKey && email.trim().toLowerCase() === configuredEmail && await equalSecret(setupKey, configuredKey));
}

export async function createAdminAccount(email: string, password: string) {
  await ensureAdminTable();
  if (await adminAuthConfigured()) throw new Error("Administrator access is already configured.");
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error("Enter a valid email address.");
  if (password.length < 10) throw new Error("Use a password with at least 10 characters.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await passwordHash(password, salt, PASSWORD_ITERATIONS);
  const now = new Date();
  await database()`INSERT INTO admin_credentials (id, email, password_hash, password_salt, password_iterations, created_at, updated_at)
    VALUES (1, ${normalizedEmail}, ${hash}, ${toBase64Url(salt)}, ${PASSWORD_ITERATIONS}, ${now}, ${now})`;
}

export async function validateAdminCredentials(email: string, password: string) {
  if (!(await adminAuthConfigured())) return false;
  const [row] = await database()<AdminRow[]>`SELECT email, password_hash, password_salt, password_iterations FROM admin_credentials WHERE id = 1`;
  if (!row || row.email !== email.trim().toLowerCase()) return false;
  const candidate = await passwordHash(password, fromBase64Url(row.password_salt), row.password_iterations);
  return equalSecret(candidate, row.password_hash);
}

export async function changeAdminPassword(currentPassword: string, nextPassword: string) {
  await ensureAdminTable();
  const [row] = await database()<AdminRow[]>`SELECT email, password_hash, password_salt, password_iterations FROM admin_credentials WHERE id = 1`;
  if (!row) throw new Error("Administrator access is not configured.");
  if (!(await validateAdminCredentials(row.email, currentPassword))) throw new Error("The current password is incorrect.");
  if (nextPassword.length < 10) throw new Error("Use a new password with at least 10 characters.");
  if (await equalSecret(currentPassword, nextPassword)) throw new Error("Choose a different password.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await passwordHash(nextPassword, salt, PASSWORD_ITERATIONS);
  await database()`UPDATE admin_credentials SET password_hash = ${hash}, password_salt = ${toBase64Url(salt)}, password_iterations = ${PASSWORD_ITERATIONS}, updated_at = ${new Date()} WHERE id = 1`;
}

export async function createAdminSession(email: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${expires}.${toBase64Url(email.trim().toLowerCase())}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, `${payload}.${await sign(payload)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_SECONDS });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
}

export async function isAdminAuthenticated() {
  if (!(await adminAuthConfigured())) return false;
  const token = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  const [expiresText, email, signature] = token.split(".");
  if (!expiresText || !email || !signature || Number(expiresText) < Math.floor(Date.now() / 1000)) return false;
  return equalSecret(signature, await sign(`${expiresText}.${email}`));
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

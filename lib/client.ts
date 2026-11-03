"use client";

const pKey = (code: string) => `roleta:p:${code}`;
const aKey = (code: string) => `roleta:a:${code}`;

function get(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function set(key: string, value: string | null) {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch {}
}

export const loadToken = (code: string) => get(pKey(code));
export const saveToken = (code: string, token: string | null) => set(pKey(code), token);
export const loadAdmin = (code: string) => get(aKey(code));
export const saveAdmin = (code: string, token: string) => set(aKey(code), token);

export async function api<T = unknown>(
  url: string,
  opts: { method?: string; body?: unknown; token?: string | null; admin?: string | null } = {}
): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.token) headers["x-participant-token"] = opts.token;
  if (opts.admin) headers["x-admin-token"] = opts.admin;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Algo deu errado."), { status: res.status });
  return data as T;
}

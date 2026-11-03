import { NextResponse } from "next/server";
import type { Group, GroupView, Participant, Wishes } from "./types";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newCode(len = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Valida o formulario do participante. Retorna mensagem de erro ou os dados limpos. */
export function parseWishes(body: Record<string, unknown>): Wishes | string {
  const nick = clean(body.nick, 30);
  const category_1 = clean(body.category_1, 60);
  const category_2 = clean(body.category_2, 60);
  const category_3 = clean(body.category_3, 60);
  const avoid = typeof body.avoid === "string" ? body.avoid.trim().slice(0, 500) : "";
  if (nick.length < 2) return "Escolha um nick com pelo menos 2 letras.";
  if (!category_1 || !category_2 || !category_3) return "Preencha as 3 categorias de presente.";
  return { nick, category_1, category_2, category_3, avoid };
}

/**
 * Sorteio: embaralha (Fisher-Yates com crypto) e cada pessoa tira a proxima da fila,
 * formando um ciclo unico. Ninguem tira a si mesmo.
 */
export function drawPairs(ids: string[]): Map<string, string> {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  const pairs = new Map<string, string>();
  a.forEach((id, i) => pairs.set(id, a[(i + 1) % a.length]));
  return pairs;
}

const wishes = (p: Participant) => ({
  id: p.id,
  nick: p.nick,
  category_1: p.category_1,
  category_2: p.category_2,
  category_3: p.category_3,
  avoid: p.avoid,
});

export function buildView(group: Group, people: Participant[], token: string | null, admin: string | null): GroupView {
  const me = token ? people.find((p) => p.token === token) ?? null : null;
  const match = me && group.drawn_at && me.assigned_to ? people.find((p) => p.id === me.assigned_to) ?? null : null;
  return {
    code: group.code,
    name: group.name,
    budget: group.budget,
    eventDate: group.event_date,
    drawn: !!group.drawn_at,
    isAdmin: !!admin && admin === group.admin_token,
    participants: people.map((p) => ({ id: p.id, nick: p.nick })),
    me: me ? wishes(me) : null,
    match: match ? wishes(match) : null,
  };
}

export function readAuth(req: Request) {
  const token = req.headers.get("x-participant-token");
  const admin = req.headers.get("x-admin-token");
  return { token: isUuid(token) ? token : null, admin: isUuid(admin) ? admin : null };
}

export const normCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

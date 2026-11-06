import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildView, fail, normCode, readAuth } from "@/lib/logic";
import { hashPin, isPin } from "@/lib/pin";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const store = db();
  const group = await store.getGroup(normCode(code));
  if (!group) return fail("Grupo não encontrado.", 404);
  const people = await store.listParticipants(group.id);
  const { token, admin } = readAuth(req);
  return NextResponse.json(buildView(group, people, token, admin));
}

/** Organizador define/troca o PIN de organizador (util para grupos criados antes do PIN). */
export async function PATCH(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const store = db();
  const group = await store.getGroup(normCode(code));
  if (!group) return fail("Grupo não encontrado.", 404);
  if (readAuth(req).admin !== group.admin_token) return fail("Só quem criou o grupo pode fazer isso.", 403);
  const body = await req.json().catch(() => ({}));
  if (!isPin(body.adminPin)) return fail("O PIN precisa ter 4 números.");
  await store.updateGroup(group.id, { admin_pin_hash: hashPin(body.adminPin), admin_failed_logins: 0, admin_locked_until: null });
  return NextResponse.json({ ok: true });
}

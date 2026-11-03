import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildView, fail, normCode, readAuth } from "@/lib/logic";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const store = db();
  const group = await store.getGroup(normCode(code));
  if (!group) return fail("Grupo não encontrado.", 404);
  const people = await store.listParticipants(group.id);
  const { token, admin } = readAuth(req);
  return NextResponse.json(buildView(group, people, token, admin));
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, normCode, readAuth, THEMES_MIN_PEOPLE } from "@/lib/logic";

/** O organizador revela o pote de temas para todo mundo. */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const store = db();
  const group = await store.getGroup(normCode(code));
  if (!group) return fail("Grupo não encontrado.", 404);
  if (readAuth(req).admin !== group.admin_token) return fail("Só quem criou o grupo pode revelar o pote.", 403);
  if (group.themes_revealed_at) return NextResponse.json({ ok: true });
  const people = await store.listParticipants(group.id);
  // Com poucas pessoas daria para adivinhar quem escreveu cada tema.
  if (people.length < THEMES_MIN_PEOPLE)
    return fail(`Precisa de pelo menos ${THEMES_MIN_PEOPLE} pessoas para revelar o pote.`);
  await store.revealThemes(group.id);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { drawPairs, fail, normCode, readAuth } from "@/lib/logic";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const store = db();
  const group = await store.getGroup(normCode(code));
  if (!group) return fail("Grupo não encontrado.", 404);
  if (readAuth(req).admin !== group.admin_token) return fail("Só quem criou o grupo pode sortear.", 403);
  if (group.drawn_at) return fail("O sorteio já foi feito.", 409);
  const people = await store.listParticipants(group.id);
  if (people.length < 3) return fail("Precisa de pelo menos 3 pessoas para sortear.");
  if (!(await store.markDrawn(group.id))) return fail("O sorteio já foi feito.", 409);
  // Relista depois de travar o grupo, para incluir quem entrou no ultimo segundo.
  const final = await store.listParticipants(group.id);
  const ids = final.map((p) => p.id);
  // Sorteio 1: quem tira quem.
  const pairs = drawPairs(ids);
  // Sorteio 2 (independente): de quem vem o tema. Ninguem recebe o proprio tema.
  const themeFrom = drawPairs(ids);
  const themeOf = new Map(final.map((p) => [p.id, p.theme]));
  await Promise.all(
    [...pairs].map(([giver, receiver]) =>
      store.updateParticipant(giver, { assigned_to: receiver, assigned_theme: themeOf.get(themeFrom.get(giver)!) ?? "" })
    )
  );
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db, DuplicateNickError } from "@/lib/db";
import { fail, isUuid, normCode, parseWishes, readAuth } from "@/lib/logic";
import { hashPin, isPin } from "@/lib/pin";

type Ctx = { params: Promise<{ code: string }> };

async function load(ctx: Ctx) {
  const { code } = await ctx.params;
  const store = db();
  const group = await store.getGroup(normCode(code));
  return { store, group };
}

const dupMsg = "Esse nick já está em uso neste grupo.";
const MAX_PEOPLE = 100;

/** Entrar no grupo. */
export async function POST(req: Request, ctx: Ctx) {
  const { store, group } = await load(ctx);
  if (!group) return fail("Grupo não encontrado.", 404);
  if (group.drawn_at) return fail("O sorteio já foi feito, não dá mais para entrar.", 409);
  const body = await req.json().catch(() => ({}));
  const parsed = parseWishes(body);
  if (typeof parsed === "string") return fail(parsed);
  if (!isPin(body.pin)) return fail("Escolha um PIN com 4 números.");
  const people = await store.listParticipants(group.id);
  if (people.length >= MAX_PEOPLE) return fail("O grupo está cheio.", 409);
  try {
    const p = await store.addParticipant({ ...parsed, group_id: group.id, pin_hash: hashPin(body.pin) });
    return NextResponse.json({ token: p.token });
  } catch (e) {
    if (e instanceof DuplicateNickError) return fail(dupMsg, 409);
    throw e;
  }
}

/** Editar os proprios desejos (o nick so muda antes do sorteio). */
export async function PATCH(req: Request, ctx: Ctx) {
  const { store, group } = await load(ctx);
  if (!group) return fail("Grupo não encontrado.", 404);
  const { token } = readAuth(req);
  const people = await store.listParticipants(group.id);
  const me = people.find((p) => p.token === token);
  if (!me) return fail("Participante não encontrado.", 403);
  const body = await req.json().catch(() => ({}));
  const parsed = parseWishes(body);
  if (typeof parsed === "string") return fail(parsed);
  // PIN e opcional na edicao: so troca se vier um novo.
  if (body.pin && !isPin(body.pin)) return fail("O PIN precisa ter 4 números.");
  // Depois do sorteio so as regras podem mudar: nick e tema ja foram sorteados.
  if (group.drawn_at) {
    parsed.nick = me.nick;
    parsed.theme = me.theme;
  }
  try {
    await store.updateParticipant(me.id, { ...parsed, ...(body.pin ? { pin_hash: hashPin(body.pin) } : {}) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DuplicateNickError) return fail(dupMsg, 409);
    throw e;
  }
}

/** Sair do grupo (o proprio participante) ou remover alguem (organizador). So antes do sorteio. */
export async function DELETE(req: Request, ctx: Ctx) {
  const { store, group } = await load(ctx);
  if (!group) return fail("Grupo não encontrado.", 404);
  if (group.drawn_at) return fail("O sorteio já foi feito.", 409);
  const { token, admin } = readAuth(req);
  const body = await req.json().catch(() => ({}));
  const people = await store.listParticipants(group.id);
  let target = people.find((p) => p.token === token);
  if (admin === group.admin_token && isUuid(body.id)) target = people.find((p) => p.id === body.id);
  if (!target) return fail("Sem permissão.", 403);
  await store.deleteParticipant(target.id);
  return NextResponse.json({ ok: true });
}

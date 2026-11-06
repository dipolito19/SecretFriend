import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clean, fail, normCode } from "@/lib/logic";
import { afterFailure, isLocked, isPin, LOCK_MINUTES, verifyPin } from "@/lib/pin";

const lockedMsg = `Muitas tentativas erradas. Tente de novo em ${LOCK_MINUTES} minutos.`;

/**
 * Entrar de qualquer aparelho.
 * - Participante: { nick, pin } -> { token }
 * - Organizador:  { organizer: true, pin } -> { adminToken }
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const store = db();
  const group = await store.getGroup(normCode(code));
  if (!group) return fail("Grupo não encontrado.", 404);
  const body = await req.json().catch(() => ({}));
  if (!isPin(body.pin)) return fail("Digite o PIN de 4 números.");

  if (body.organizer === true) {
    if (!group.admin_pin_hash) return fail("Este grupo não tem PIN de organizador. Use o link de organizador.", 400);
    if (isLocked(group.admin_locked_until)) return fail(lockedMsg, 429);
    if (!verifyPin(body.pin, group.admin_pin_hash)) {
      const f = afterFailure(group.admin_failed_logins ?? 0);
      await store.updateGroup(group.id, { admin_failed_logins: f.fails, admin_locked_until: f.lockedUntil });
      return fail(f.lockedUntil ? lockedMsg : "PIN de organizador errado.", f.lockedUntil ? 429 : 401);
    }
    await store.updateGroup(group.id, { admin_failed_logins: 0, admin_locked_until: null });
    return NextResponse.json({ adminToken: group.admin_token });
  }

  const nick = clean(body.nick, 30).toLowerCase();
  const people = await store.listParticipants(group.id);
  const me = people.find((p) => p.nick.toLowerCase() === nick);
  // Mesma mensagem para nick inexistente e PIN errado: nao entrega quem participa.
  const wrong = "Nick ou PIN errado.";
  if (!me) return fail(wrong, 401);
  if (!me.pin_hash) return fail("Essa pessoa entrou antes do PIN existir. Use o link pessoal dela.", 400);
  if (isLocked(me.locked_until)) return fail(lockedMsg, 429);
  if (!verifyPin(body.pin, me.pin_hash)) {
    const f = afterFailure(me.failed_logins ?? 0);
    await store.updateParticipant(me.id, { failed_logins: f.fails, locked_until: f.lockedUntil });
    return fail(f.lockedUntil ? lockedMsg : wrong, f.lockedUntil ? 429 : 401);
  }
  await store.updateParticipant(me.id, { failed_logins: 0, locked_until: null });
  return NextResponse.json({ token: me.token });
}

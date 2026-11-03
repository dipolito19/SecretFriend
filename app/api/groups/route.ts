import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clean, fail, newCode } from "@/lib/logic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = clean(body.name, 60);
  if (name.length < 2) return fail("Dê um nome para o grupo.");
  const store = db();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    if (await store.getGroup(code)) continue;
    const group = await store.createGroup({
      code,
      name,
      budget: clean(body.budget, 40) || null,
      event_date: /^\d{2}\/\d{2}$/.test(clean(body.eventDate, 5)) ? clean(body.eventDate, 5) : null,
    });
    return NextResponse.json({ code: group.code, adminToken: group.admin_token });
  }
  return fail("Não consegui gerar um código, tente de novo.", 500);
}

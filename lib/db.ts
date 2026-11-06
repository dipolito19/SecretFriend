import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Group, Participant } from "./types";

/**
 * Camada de dados. Em producao usa o Supabase (service role, so no servidor).
 * Sem variaveis de ambiente, cai num banco em memoria para desenvolvimento local.
 */
export interface Store {
  createGroup(g: { code: string; name: string; budget: string | null; event_date: string | null; admin_pin_hash: string | null }): Promise<Group>;
  getGroup(code: string): Promise<Group | null>;
  listParticipants(groupId: string): Promise<Participant[]>;
  addParticipant(p: Omit<Participant, "id" | "token" | "assigned_to" | "assigned_theme" | "failed_logins" | "locked_until" | "created_at">): Promise<Participant>;
  updateParticipant(id: string, fields: Partial<Participant>): Promise<void>;
  deleteParticipant(id: string): Promise<void>;
  updateGroup(id: string, fields: Partial<Group>): Promise<void>;
  /** Revela o pote de temas do grupo. */
  revealThemes(groupId: string): Promise<void>;
  /** Marca o grupo como sorteado; retorna false se ja tinha sido sorteado. */
  markDrawn(groupId: string): Promise<boolean>;
}

export class DuplicateNickError extends Error {}

function supabaseStore(client: SupabaseClient): Store {
  const check = <T>(res: { data: T; error: { message: string; code?: string } | null }) => {
    if (res.error) {
      if (res.error.code === "23505") throw new DuplicateNickError(res.error.message);
      throw new Error(res.error.message);
    }
    return res.data;
  };
  return {
    async createGroup(g) {
      return check(await client.from("groups").insert(g).select().single()) as Group;
    },
    async getGroup(code) {
      return check(await client.from("groups").select().eq("code", code).maybeSingle()) as Group | null;
    },
    async listParticipants(groupId) {
      return check(
        await client.from("participants").select().eq("group_id", groupId).order("created_at")
      ) as Participant[];
    },
    async addParticipant(p) {
      return check(await client.from("participants").insert(p).select().single()) as Participant;
    },
    async updateParticipant(id, fields) {
      check(await client.from("participants").update(fields).eq("id", id));
    },
    async deleteParticipant(id) {
      check(await client.from("participants").delete().eq("id", id));
    },
    async updateGroup(id, fields) {
      check(await client.from("groups").update(fields).eq("id", id));
    },
    async revealThemes(groupId) {
      check(await client.from("groups").update({ themes_revealed_at: new Date().toISOString() }).eq("id", groupId));
    },
    async markDrawn(groupId) {
      const data = check(
        await client
          .from("groups")
          .update({ drawn_at: new Date().toISOString() })
          .eq("id", groupId)
          .is("drawn_at", null)
          .select("id")
      ) as { id: string }[];
      return data.length > 0;
    },
  };
}

function memoryStore(): Store {
  const g = globalThis as unknown as { __mem?: { groups: Group[]; participants: Participant[] } };
  const mem = (g.__mem ??= { groups: [], participants: [] });
  const now = () => new Date().toISOString();
  return {
    async createGroup(input) {
      const group: Group = { ...input, id: crypto.randomUUID(), admin_token: crypto.randomUUID(), drawn_at: null, themes_revealed_at: null, admin_failed_logins: 0, admin_locked_until: null, created_at: now() };
      mem.groups.push(group);
      return group;
    },
    async getGroup(code) {
      return mem.groups.find((x) => x.code === code) ?? null;
    },
    async listParticipants(groupId) {
      return mem.participants.filter((p) => p.group_id === groupId);
    },
    async addParticipant(input) {
      if (mem.participants.some((p) => p.group_id === input.group_id && p.nick.toLowerCase() === input.nick.toLowerCase()))
        throw new DuplicateNickError("nick");
      const p: Participant = { ...input, id: crypto.randomUUID(), token: crypto.randomUUID(), assigned_to: null, assigned_theme: null, failed_logins: 0, locked_until: null, created_at: now() };
      mem.participants.push(p);
      return p;
    },
    async updateParticipant(id, fields) {
      const p = mem.participants.find((x) => x.id === id);
      if (!p) return;
      if (fields.nick && mem.participants.some((o) => o.id !== id && o.group_id === p.group_id && o.nick.toLowerCase() === fields.nick!.toLowerCase()))
        throw new DuplicateNickError("nick");
      Object.assign(p, fields);
    },
    async deleteParticipant(id) {
      mem.participants = mem.participants.filter((x) => x.id !== id);
    },
    async updateGroup(id, fields) {
      const group = mem.groups.find((x) => x.id === id);
      if (group) Object.assign(group, fields);
    },
    async revealThemes(groupId) {
      const group = mem.groups.find((x) => x.id === groupId);
      if (group && !group.themes_revealed_at) group.themes_revealed_at = now();
    },
    async markDrawn(groupId) {
      const group = mem.groups.find((x) => x.id === groupId);
      if (!group || group.drawn_at) return false;
      group.drawn_at = now();
      return true;
    },
  };
}

let cached: Store | null = null;
export function db(): Store {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    cached = supabaseStore(createClient(url, key, { auth: { persistSession: false } }));
  } else {
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_MEMORY_DB)
      throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    console.warn("[roleta] Sem Supabase configurado: usando banco em memoria.");
    cached = memoryStore();
  }
  return cached;
}

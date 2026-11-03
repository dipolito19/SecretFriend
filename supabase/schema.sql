-- Roleta do Amigo Secreto: rode este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.groups (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name         text not null,
  budget       text,
  event_date   text,
  admin_token  uuid not null default gen_random_uuid(),
  drawn_at     timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists public.participants (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups(id) on delete cascade,
  nick          text not null,
  theme         text not null default '',
  avoid         text not null default '',
  token         uuid not null default gen_random_uuid() unique,
  assigned_to   uuid references public.participants(id) on delete set null,
  assigned_theme text,
  created_at    timestamptz not null default now()
);

create unique index if not exists participants_group_nick_idx
  on public.participants (group_id, lower(nick));
create index if not exists participants_group_idx on public.participants (group_id);

-- O site acessa o banco apenas pelo servidor (service role).
-- RLS ligado e sem policies = ninguem consegue ler/escrever com a chave publica.
alter table public.groups enable row level security;
alter table public.participants enable row level security;

-- Sem acesso pela chave publica.
revoke all on table public.groups from anon, authenticated;
revoke all on table public.participants from anon, authenticated;

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
  category_1    text not null,
  category_2    text not null,
  category_3    text not null,
  avoid         text not null default '',
  token         uuid not null default gen_random_uuid() unique,
  assigned_to   uuid references public.participants(id) on delete set null,
  created_at    timestamptz not null default now()
);

create unique index if not exists participants_group_nick_idx
  on public.participants (group_id, lower(nick));
create index if not exists participants_group_idx on public.participants (group_id);

-- O site acessa o banco apenas pelo servidor (service role).
-- RLS ligado e sem policies = ninguem consegue ler/escrever com a chave publica.
alter table public.groups enable row level security;
alter table public.participants enable row level security;

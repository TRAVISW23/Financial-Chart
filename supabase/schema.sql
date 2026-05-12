create extension if not exists pgcrypto;

create table if not exists public.charts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  heat integer not null default 0,
  image_url text not null,
  image_path text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists charts_created_at_idx on public.charts (created_at desc);
create index if not exists charts_heat_idx on public.charts (heat desc, created_at desc);

alter table public.charts enable row level security;

drop policy if exists "Charts are publicly readable" on public.charts;
create policy "Charts are publicly readable"
on public.charts
for select
to anon
using (true);

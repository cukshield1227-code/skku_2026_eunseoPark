create table if not exists public.lotto_draws (
  id bigint generated always as identity primary key,
  numbers jsonb not null,
  sum integer not null,
  created_at timestamptz not null default now()
);

alter table public.lotto_draws enable row level security;

drop policy if exists "Allow service role full access" on public.lotto_draws;

create policy "Allow service role full access"
on public.lotto_draws
for all
to service_role
using (true)
with check (true);

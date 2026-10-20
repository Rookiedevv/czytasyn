-- Czytasyn tables. Safe to run more than once.
-- Tables are prefixed so they can live next to another app's tables in the
-- same Supabase project. Row Level Security makes sure a parent only ever
-- sees their own children and progress.

create table if not exists public.czytasyn_children (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  avatar      text not null default '🦊',
  theme       text not null default 'forest',
  lang        text not null default 'pl' check (lang in ('pl', 'en')),
  created_at  timestamptz not null default now()
);

create table if not exists public.czytasyn_progress (
  child_id       uuid not null references public.czytasyn_children (id) on delete cascade,
  lesson_id      text not null,
  stars          int  not null default 0 check (stars between 0 and 3),
  attempts       int  not null default 0,
  completed      boolean not null default false,
  mastered_items jsonb not null default '[]'::jsonb,
  last_seen      timestamptz not null default now(),
  primary key (child_id, lesson_id)
);

create index if not exists czytasyn_children_user_id_idx on public.czytasyn_children (user_id);

alter table public.czytasyn_children enable row level security;
alter table public.czytasyn_progress enable row level security;

drop policy if exists "own children" on public.czytasyn_children;
create policy "own children" on public.czytasyn_children
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own children's progress" on public.czytasyn_progress;
create policy "own children's progress" on public.czytasyn_progress
  for all to authenticated
  using (
    exists (
      select 1 from public.czytasyn_children c
      where c.id = child_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.czytasyn_children c
      where c.id = child_id and c.user_id = (select auth.uid())
    )
  );

-- Many-to-many link between children and educators
create table if not exists public.child_educators (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  educator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (child_id, educator_id)
);

alter table public.child_educators enable row level security;

-- Admins / secretaries full access
create policy "Admins and secretaries manage child_educators"
on public.child_educators
for all
using (is_admin_or_secretary(auth.uid()));

-- Educators can see and manage their own links
create policy "Educators manage their child links"
on public.child_educators
for all
using (
  is_educator(auth.uid())
  and educator_id = (select id from public.profiles where user_id = auth.uid())
)
with check (
  is_educator(auth.uid())
  and educator_id = (select id from public.profiles where user_id = auth.uid())
);



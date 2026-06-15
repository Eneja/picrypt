create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  role         text not null default 'user' check (role in ('admin', 'user')),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  approved_at  timestamptz,
  approved_by  uuid references auth.users(id)
);

create index profiles_status_idx on profiles (status);
create index profiles_role_idx on profiles (role);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, status)
  values (new.id, coalesce(new.email, ''), 'user', 'pending');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users created before this migration
insert into public.profiles (id, email, role, status)
select id, coalesce(email, ''), 'user', 'pending'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

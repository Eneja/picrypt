create table drops (
  id          text primary key,
  payload     text not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index drops_expires_at_idx on drops (expires_at);

alter table drops enable row level security;

-- ============================================================
-- VIAVOX TRACKER — Supabase SQL Setup
-- Wklej całość w: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. PRACOWNICY
create table if not exists employees (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  is_student  boolean default false,
  uk_number   text default '',
  created_at  timestamptz default now()
);

-- 2. PROJEKTY
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  number      text default '',
  created_at  timestamptz default now()
);

-- 3. KIEROWNICY
create table if not exists managers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  pin         text not null,
  is_admin    boolean default false,
  created_at  timestamptz default now()
);

-- 4. POWIĄZANIE KIEROWNIK ↔ PROJEKT
create table if not exists manager_projects (
  manager_id  uuid references managers(id) on delete cascade,
  project_id  uuid references projects(id) on delete cascade,
  primary key (manager_id, project_id)
);

-- 5. GODZINY
create table if not exists hours (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  project_id  uuid references projects(id) on delete cascade,
  work_date   date not null,
  hours       numeric(4,1) check (hours >= 0 and hours <= 24),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (employee_id, project_id, work_date)
);

-- ── DANE STARTOWE ─────────────────────────────────────────────────────────

-- Projekty
insert into projects (id, name, number) values
  ('11111111-1111-1111-1111-111111111111', 'Projekt Alpha', '2024-001'),
  ('22222222-2222-2222-2222-222222222222', 'Projekt Beta',  '2024-001'),
  ('33333333-3333-3333-3333-333333333333', 'Projekt Gamma', '2024-002');

-- Kierownicy (admin PIN: 0000, Jan PIN: 1234, Maria PIN: 5678)
insert into managers (id, name, pin, is_admin) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Admin',        '0000', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jan Kowalski', '1234', false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Maria Nowak',  '5678', false);

-- Przypisania
insert into manager_projects (manager_id, project_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333');

-- Przykładowi pracownicy
insert into employees (first_name, last_name, is_student, uk_number) values
  ('Anna',    'Kowalska',    true,  'UK100000'),
  ('Marek',   'Nowak',       false, ''),
  ('Karolina','Wiśniewska',  false, 'UK100002'),
  ('Piotr',   'Zając',       true,  ''),
  ('Zofia',   'Lewandowska', false, 'UK100004');

-- ── ROW LEVEL SECURITY (wyłączone dla uproszczenia — włącz gdy chcesz) ───
alter table employees      disable row level security;
alter table projects       disable row level security;
alter table managers       disable row level security;
alter table manager_projects disable row level security;
alter table hours          disable row level security;

-- Zezwól na pełny dostęp przez anon key
grant all on employees       to anon;
grant all on projects        to anon;
grant all on managers        to anon;
grant all on manager_projects to anon;
grant all on hours           to anon;


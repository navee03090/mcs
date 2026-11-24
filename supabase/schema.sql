-- ReportFix schema for CodeQuest 2026
create extension if not exists "pgcrypto";

-- Roles: student | staff | admin
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('student','staff','admin')),
  department text check (department in ('EE','CSE','IS','Library','Cafeteria','Labs') or department is null),
  trust_score numeric not null default 50,
  trust_reason text not null default 'New account — base trust 50',
  created_at timestamptz not null default now()
);

create table if not exists campus_locations (
  id text primary key,
  name text not null,
  building text,
  department_hint text
);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  canonical_summary text not null,
  department text not null check (department in ('EE','CSE','IS','Library','Cafeteria','Labs')),
  location_id text references campus_locations(id),
  location_text text not null,
  priority text not null check (priority in ('critical','high','medium','low')),
  priority_reason text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved','reopened','needs_clarification','confidential')),
  me_too_count int not null default 1,
  crowd_weight numeric not null default 1,
  is_confidential boolean not null default false,
  reporter_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
  raw_text text not null,
  ai_department text,
  ai_location text,
  ai_priority text,
  ai_reason text,
  ai_category text,
  is_confidential boolean not null default false,
  needs_clarification boolean not null default false,
  clarification_question text,
  created_at timestamptz not null default now()
);

create table if not exists issue_votes (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  voter_id uuid not null references profiles(id) on delete cascade,
  vote text not null check (vote in ('confirm','dispute')),
  created_at timestamptz not null default now(),
  unique (issue_id, voter_id)
);

create table if not exists trust_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  delta numeric not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Seed campus locations
insert into campus_locations (id, name, building, department_hint) values
  ('cse-lab-1', 'CSE Lab 1', 'CSE Block', 'CSE'),
  ('cse-lab-2', 'CSE Lab 2', 'CSE Block', 'CSE'),
  ('cse-lab-3', 'CSE Lab 3', 'CSE Block', 'CSE'),
  ('ee-lab-1', 'EE Lab 1', 'EE Block', 'EE'),
  ('library', 'Central Library', 'Library', 'Library'),
  ('cafeteria', 'Main Cafeteria', 'Student Center', 'Cafeteria'),
  ('is-lab', 'IS Lab', 'IS Block', 'IS'),
  ('labs-common', 'Common Labs Area', 'Labs Complex', 'Labs'),
  ('hostel-a', 'Hostel A', 'Hostels', null),
  ('auditorium', 'Auditorium', 'Main Block', null)
on conflict (id) do nothing;

-- Seed demo users for judges
insert into profiles (id, name, role, department, trust_score, trust_reason) values
  ('11111111-1111-1111-1111-111111111101', 'Ali Student', 'student', null, 62, 'Accurate reports in past'),
  ('11111111-1111-1111-1111-111111111102', 'Sara Student', 'student', null, 48, 'New-ish account'),
  ('11111111-1111-1111-1111-111111111103', 'Hassan Student', 'student', null, 35, 'One disputed false report'),
  ('22222222-2222-2222-2222-222222222201', 'CSE Staff', 'staff', 'CSE', 70, 'Department staff'),
  ('22222222-2222-2222-2222-222222222202', 'EE Staff', 'staff', 'EE', 70, 'Department staff'),
  ('22222222-2222-2222-2222-222222222203', 'Library Staff', 'staff', 'Library', 70, 'Department staff'),
  ('22222222-2222-2222-2222-222222222204', 'Cafeteria Staff', 'staff', 'Cafeteria', 70, 'Department staff'),
  ('22222222-2222-2222-2222-222222222205', 'IS Staff', 'staff', 'IS', 70, 'Department staff'),
  ('22222222-2222-2222-2222-222222222206', 'Labs Staff', 'staff', 'Labs', 70, 'Department staff'),
  ('33333333-3333-3333-3333-333333333301', 'Campus Admin', 'admin', null, 90, 'Admin account')
on conflict (id) do nothing;

alter table profiles enable row level security;
alter table issues enable row level security;
alter table reports enable row level security;
alter table issue_votes enable row level security;
alter table trust_events enable row level security;
alter table campus_locations enable row level security;

-- Open policies for hackathon judge mode (app uses secret key server-side anyway)
drop policy if exists "anon read locations" on campus_locations;
create policy "anon read locations" on campus_locations for select using (true);

drop policy if exists "service all profiles" on profiles;
create policy "service all profiles" on profiles for all using (true) with check (true);

drop policy if exists "service all issues" on issues;
create policy "service all issues" on issues for all using (true) with check (true);

drop policy if exists "service all reports" on reports;
create policy "service all reports" on reports for all using (true) with check (true);

drop policy if exists "service all votes" on issue_votes;
create policy "service all votes" on issue_votes for all using (true) with check (true);

drop policy if exists "service all trust" on trust_events;
create policy "service all trust" on trust_events for all using (true) with check (true);

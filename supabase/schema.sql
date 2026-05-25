create extension if not exists pgcrypto;

-- updated_atを自動更新する共通トリガー関数。
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table if not exists public.teacher_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    display_name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 先生が作るクラス。class_codeは生徒IDの先頭にも使う。
create table if not exists public.classes (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
    name text not null,
    class_code text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 生徒はメールを持たず、先生が発行したlogin_idでログインする。
create table if not exists public.students (
    id uuid primary key default gen_random_uuid(),
    class_id uuid not null references public.classes(id) on delete cascade,
    login_id text not null unique,
    display_name text not null,
    password_hash text not null,
    must_change_password boolean not null default true,
    last_login_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- クエスト定義のexp_01形式とDB側の実験一覧を対応させる。
create table if not exists public.experiments (
    id uuid primary key default gen_random_uuid(),
    experiment_code text not null unique check (experiment_code ~ '^exp_[0-9]{2}$'),
    title text not null,
    display_order integer not null default 0,
    is_available boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 先生の進捗管理ボードで見るための、生徒ごとの実験状態。
create table if not exists public.student_progress (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    experiment_id uuid not null references public.experiments(id) on delete cascade,
    status text not null default 'started' check (
        status in ('not_started', 'started', 'reagent_added', 'mixing', 'completed', 'failed')
    ),
    progress_percent integer not null default 25 check (progress_percent between 0 and 100),
    mixing_progress numeric not null default 0,
    required_mixing numeric not null default 300,
    started_at timestamptz,
    completed_at timestamptz,
    updated_at timestamptz not null default now(),
    unique (student_id, experiment_id)
);

-- 生徒ごとのトロフィー獲得履歴。同じトロフィーは1回だけ保存する。
create table if not exists public.student_trophies (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    trophy_id text not null,
    acquired_at timestamptz not null default now(),
    unique (student_id, trophy_id)
);

drop trigger if exists set_teacher_profiles_updated_at on public.teacher_profiles;
create trigger set_teacher_profiles_updated_at
before update on public.teacher_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_classes_updated_at on public.classes;
create trigger set_classes_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists set_experiments_updated_at on public.experiments;
create trigger set_experiments_updated_at
before update on public.experiments
for each row execute function public.set_updated_at();

drop trigger if exists set_student_progress_updated_at on public.student_progress;
create trigger set_student_progress_updated_at
before update on public.student_progress
for each row execute function public.set_updated_at();

insert into public.experiments (experiment_code, title, display_order, is_available)
values
    ('exp_01', '酸素の発生実験', 1, true),
    ('exp_02', '二酸化炭素の発生実験', 2, true),
    ('exp_03', '金属の溶け方（アルミニウム）', 3, true),
    ('exp_04', '石灰水と二酸化炭素の反応', 4, true),
    ('exp_05', '硝酸銀水溶液の反応', 5, true)
on conflict (experiment_code) do update set
    title = excluded.title,
    display_order = excluded.display_order,
    is_available = excluded.is_available,
    updated_at = now();

alter table public.teacher_profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.experiments enable row level security;
alter table public.student_progress enable row level security;
alter table public.student_trophies enable row level security;

-- 先生は自分自身のプロフィールだけ操作できる。
drop policy if exists "teachers can read their profile" on public.teacher_profiles;
create policy "teachers can read their profile"
on public.teacher_profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "teachers can create their profile" on public.teacher_profiles;
create policy "teachers can create their profile"
on public.teacher_profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "teachers can update their profile" on public.teacher_profiles;
create policy "teachers can update their profile"
on public.teacher_profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "teachers manage own classes" on public.classes;
create policy "teachers manage own classes"
on public.classes
for all
to authenticated
using ((select auth.uid()) = teacher_id)
with check ((select auth.uid()) = teacher_id);

drop policy if exists "teachers read own students" on public.students;
create policy "teachers read own students"
on public.students
for select
to authenticated
using (
    exists (
        select 1 from public.classes
        where classes.id = students.class_id
        and classes.teacher_id = (select auth.uid())
    )
);

drop policy if exists "teachers create own students" on public.students;
create policy "teachers create own students"
on public.students
for insert
to authenticated
with check (
    exists (
        select 1 from public.classes
        where classes.id = students.class_id
        and classes.teacher_id = (select auth.uid())
    )
);

drop policy if exists "teachers update own students" on public.students;
create policy "teachers update own students"
on public.students
for update
to authenticated
using (
    exists (
        select 1 from public.classes
        where classes.id = students.class_id
        and classes.teacher_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1 from public.classes
        where classes.id = students.class_id
        and classes.teacher_id = (select auth.uid())
    )
);

drop policy if exists "experiments are readable by authenticated users" on public.experiments;
create policy "experiments are readable by authenticated users"
on public.experiments
for select
to authenticated
using (true);

drop policy if exists "teachers read own student progress" on public.student_progress;
create policy "teachers read own student progress"
on public.student_progress
for select
to authenticated
using (
    exists (
        select 1
        from public.students
        join public.classes on classes.id = students.class_id
        where students.id = student_progress.student_id
        and classes.teacher_id = (select auth.uid())
    )
);

drop policy if exists "teachers read own student trophies" on public.student_trophies;
create policy "teachers read own student trophies"
on public.student_trophies
for select
to authenticated
using (
    exists (
        select 1
        from public.students
        join public.classes on classes.id = students.class_id
        where students.id = student_trophies.student_id
        and classes.teacher_id = (select auth.uid())
    )
);

create index if not exists idx_classes_teacher_id on public.classes(teacher_id);
create index if not exists idx_students_class_id on public.students(class_id);
create index if not exists idx_student_progress_student_id on public.student_progress(student_id);
create index if not exists idx_student_progress_experiment_id on public.student_progress(experiment_id);
create index if not exists idx_student_trophies_student_id on public.student_trophies(student_id);

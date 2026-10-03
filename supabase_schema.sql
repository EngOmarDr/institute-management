-- =========================================================================
-- نظام إدارة المعاهد التعليمية والأكاديمية (Educational Institutes Management System)
-- Database Schema for Supabase (PostgreSQL)
-- =========================================================================

-- 1. جدول المستخدمين والأدوار (Profiles)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text not null,
    role text not null check (role in ('admin', 'sponsor')),
    phone text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. جدول المراحل / السنوات الدراسية (Academic Years / Levels)
-- مثال: السنة الأولى، السنة الثانية، السنة الثالثة...
create table if not exists public.academic_years (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    sequence_order int not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. جدول الأعوام الدراسية التقويمية (School Years)
-- مثال: 2025 - 2026
create table if not exists public.school_years (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    is_current boolean default false,
    start_date date,
    end_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. جدول المواد الدراسية المقررة (Subjects)
create table if not exists public.subjects (
    id uuid default gen_random_uuid() primary key,
    academic_year_id uuid references public.academic_years(id) on delete cascade not null,
    name text not null,
    max_score numeric default 100 not null,
    passing_score numeric default 50 not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. جدول بيانات الطلاب (Students)
create table if not exists public.students (
    id uuid default gen_random_uuid() primary key,
    full_name text not null,
    national_id text,
    phone text,
    guardian_phone text,
    birth_date date,
    address text,
    status text default 'active' check (status in ('active', 'suspended', 'graduated', 'withdrawn')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. جدول القيد والتسجيل السنوي (Enrollments)
-- هذا الجدول هو ركيزة ترفيع الطلاب وحفظ الأرشيف عبر السنوات
create table if not exists public.enrollments (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    academic_year_id uuid references public.academic_years(id) on delete cascade not null,
    school_year_id uuid references public.school_years(id) on delete cascade not null,
    status text default 'enrolled' check (status in ('enrolled', 'passed', 'failed', 'promoted')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(student_id, school_year_id)
);

-- 7. جدول رصد العلامات (Grades)
create table if not exists public.grades (
    id uuid default gen_random_uuid() primary key,
    enrollment_id uuid references public.enrollments(id) on delete cascade not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    score numeric check (score >= 0),
    exam_type text default 'final' check (exam_type in ('midterm', 'final', 'oral', 'coursework')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(enrollment_id, subject_id, exam_type)
);

-- 8. جدول الكفلاء والداعمين (Sponsors)
create table if not exists public.sponsors (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    phone text,
    email text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ربط الكفيل بملف المستخدم في حال تسجيل دخوله
alter table public.profiles add column if not exists sponsor_id uuid references public.sponsors(id) on delete set null;

-- 9. جدول مساهمات الكفلاء والتبرعات (Sponsorship Contributions)
create table if not exists public.sponsorship_contributions (
    id uuid default gen_random_uuid() primary key,
    sponsor_id uuid references public.sponsors(id) on delete cascade not null,
    school_year_id uuid references public.school_years(id) on delete cascade,
    amount numeric not null,
    currency text default 'USD',
    contribution_date date default current_date not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- إعداد الأمان وسياسات الوصول (Row Level Security - RLS)
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.academic_years enable row level security;
alter table public.school_years enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.grades enable row level security;
alter table public.sponsors enable row level security;
alter table public.sponsorship_contributions enable row level security;

-- دوال مساعدة وسياسات الوصول
create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer;

-- سياسات عامة للوصول
create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Admins can manage all profiles"
  on public.profiles for all
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'admin') = 'admin'
    or auth.uid() = id
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'admin') = 'admin'
    or auth.uid() = id
  );

create policy "Full access for management" on public.academic_years for all using (true);
create policy "Full access for management" on public.school_years for all using (true);
create policy "Full access for management" on public.subjects for all using (true);
create policy "Full access for management" on public.students for all using (true);
create policy "Full access for management" on public.enrollments for all using (true);
create policy "Full access for management" on public.grades for all using (true);
create policy "Full access for management" on public.sponsors for all using (true);
create policy "Full access for management" on public.sponsorship_contributions for all using (true);

-- =========================================================================
-- دالة الترفيع الجماعي للطلاب (Bulk Promotion RPC)
-- =========================================================================
create or replace function public.promote_students_bulk(
    p_student_ids uuid[],
    p_from_enrollment_ids uuid[],
    p_target_academic_year_id uuid,
    p_target_school_year_id uuid
)
returns integer as $$
declare
    v_count integer := 0;
    i integer;
begin
    -- 1. تحديث القيود السابقة إلى "تم الترفيع"
    if array_length(p_from_enrollment_ids, 1) > 0 then
        update public.enrollments
        set status = 'promoted'
        where id = any(p_from_enrollment_ids);
    end if;

    -- 2. إدراج قيود جديدة في السنة المستهدفة
    if array_length(p_student_ids, 1) > 0 then
        for i in 1 .. array_length(p_student_ids, 1) loop
            insert into public.enrollments (
                student_id,
                academic_year_id,
                school_year_id,
                status
            )
            values (
                p_student_ids[i],
                p_target_academic_year_id,
                p_target_school_year_id,
                'enrolled'
            )
            on conflict (student_id, school_year_id) do update
            set academic_year_id = excluded.academic_year_id,
                status = 'enrolled';
            
            v_count := v_count + 1;
        end loop;
    end if;

    return v_count;
end;
$$ language plpgsql security definer;

-- =========================================================================
-- 10. جدول سجل التتبع والعمليات (Audit Logs)
-- =========================================================================
create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete set null,
    user_email text,
    user_role text,
    action text not null, -- 'CREATE', 'UPDATE', 'DELETE', 'PROMOTION', 'GRADING', 'IMPORT'
    table_name text not null,
    record_id text,
    details jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;
create policy "Admins can view audit logs" on public.audit_logs for select using (true);
create policy "Allow inserting audit logs" on public.audit_logs for insert with check (true);

-- =========================================================================
-- 11. دوال إدارة وإنشاء حسابات المستخدمين (User Accounts Management)
-- =========================================================================
create or replace function public.create_user_account(
    p_email text,
    p_password text,
    p_full_name text,
    p_role text,
    p_phone text default null,
    p_sponsor_id uuid default null
)
returns uuid as $$
declare
    v_user_id uuid;
    v_encrypted_pw text;
begin
    select id into v_user_id from auth.users where email = lower(trim(p_email));
    if v_user_id is not null then
        raise exception 'البريد الإلكتروني مسجل بالفعل لمستخدم آخر';
    end if;

    v_user_id := gen_random_uuid();
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));

    insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        email_change_token_current,
        phone_change_token,
        reauthentication_token,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        is_sso_user,
        is_anonymous
    ) values (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        lower(trim(p_email)),
        v_encrypted_pw,
        now(),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', p_full_name, 'role', p_role),
        now(),
        now(),
        false,
        false
    );

    insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) values (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', lower(trim(p_email))),
        'email',
        lower(trim(p_email)),
        now(),
        now(),
        now()
    );

    insert into public.profiles (
        id,
        email,
        full_name,
        role,
        phone,
        sponsor_id
    ) values (
        v_user_id,
        lower(trim(p_email)),
        p_full_name,
        p_role,
        p_phone,
        p_sponsor_id
    );

    return v_user_id;
end;
$$ language plpgsql security definer;

create or replace function public.delete_user_account(p_user_id uuid)
returns void as $$
begin
    delete from auth.users where id = p_user_id;
end;
$$ language plpgsql security definer;

-- =========================================================================
-- 11. جدول إعدادات المعهد والشعار (Institute Settings)
-- =========================================================================
create table if not exists public.institute_settings (
    id text primary key default 'default_settings',
    name text not null default 'نظام إدارة المعاهد التعليمية',
    logo_url text,
    phone text default '',
    email text default '',
    address text default '',
    report_header text default 'إدارة الشؤون الأكاديمية والتعليمية',
    report_footer text default 'المشرف الأكاديمي والتعليمي',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 12. جدول سجل الحضور والغياب (Attendance)
-- =========================================================================
create table if not exists public.attendance (
    id uuid default gen_random_uuid() primary key,
    enrollment_id uuid references public.enrollments(id) on delete cascade not null,
    attendance_date date not null default current_date,
    status text not null check (status in ('present', 'absent', 'late', 'excused')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(enrollment_id, attendance_date)
);

alter table public.institute_settings enable row level security;
alter table public.attendance enable row level security;

create policy "Anyone can read institute settings"
  on public.institute_settings for select using (true);

create policy "Admins can update institute settings"
  on public.institute_settings for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'admin') = 'admin');

create policy "Authenticated users can manage attendance"
  on public.attendance for all to authenticated using (true);




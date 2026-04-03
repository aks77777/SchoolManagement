/*
  # School Management System - Complete Schema with Profile Trigger
  
  Run this entire script in your new Supabase project's SQL Editor.
  
  Includes:
  1. Helper function to prevent RLS recursion
  2. All ENUM types
  3. All tables
  4. RLS policies
  5. A trigger to auto-create profiles on signup (fixes email-confirmation flow)
  6. Indexes
*/

-- ============================================================
-- 1. Helper Function for Secure Role Checking (prevents RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role::text INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

-- ============================================================
-- 2. Create ENUM Types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_category AS ENUM ('tc', 'bonafide', 'agreement', 'notes', 'marksheet', 'answer_sheet', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE achievement_category AS ENUM ('academic', 'sports', 'cultural', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. Create Tables
-- ============================================================

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade int NOT NULL,
  section text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name text NOT NULL DEFAULT '',
  phone text,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Periods
CREATE TABLE IF NOT EXISTS periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  period_number int NOT NULL,
  day_of_week int NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_period_number CHECK (period_number >= 1 AND period_number <= 8),
  CONSTRAINT valid_day_of_week CHECK (day_of_week >= 1 AND day_of_week <= 7)
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period_id uuid REFERENCES periods(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, period_id, date)
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  document_category document_category NOT NULL DEFAULT 'other',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  total_marks int NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL,
  marks int NOT NULL DEFAULT 1,
  order_number int NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_correct_option CHECK (correct_option IN ('A', 'B', 'C', 'D'))
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score int DEFAULT 0,
  total_marks int NOT NULL,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Quiz Responses
CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES quiz_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option text,
  is_correct boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_selected_option CHECK (selected_option IN ('A', 'B', 'C', 'D'))
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category achievement_category NOT NULL DEFAULT 'other',
  rank int,
  awarded_date date DEFAULT CURRENT_DATE,
  awarded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. Enable RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Grant Permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role TO anon;

-- ============================================================
-- 6. RLS Policies (drop first so re-runs never fail)
-- ============================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR get_my_role() = 'admin' OR get_my_role() = 'teacher');

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL TO authenticated
  USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Classes
DROP POLICY IF EXISTS "Authenticated users can view classes" ON classes;
CREATE POLICY "Authenticated users can view classes"
  ON classes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL TO authenticated
  USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Subjects
DROP POLICY IF EXISTS "Authenticated users can view subjects" ON subjects;
CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL TO authenticated
  USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Periods
DROP POLICY IF EXISTS "Authenticated users can view periods" ON periods;
CREATE POLICY "Authenticated users can view periods"
  ON periods FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage periods" ON periods;
CREATE POLICY "Admins can manage periods"
  ON periods FOR ALL TO authenticated
  USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Attendance
DROP POLICY IF EXISTS "Students can view own attendance" ON attendance;
CREATE POLICY "Students can view own attendance"
  ON attendance FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view class attendance" ON attendance;
CREATE POLICY "Teachers can view class attendance"
  ON attendance FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Teachers can mark attendance" ON attendance;
CREATE POLICY "Teachers can mark attendance"
  ON attendance FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'teacher');

DROP POLICY IF EXISTS "Teachers can update attendance" ON attendance;
CREATE POLICY "Teachers can update attendance"
  ON attendance FOR UPDATE TO authenticated
  USING (get_my_role() = 'teacher') WITH CHECK (get_my_role() = 'teacher');

DROP POLICY IF EXISTS "Admins can manage all attendance" ON attendance;
CREATE POLICY "Admins can manage all attendance"
  ON attendance FOR ALL TO authenticated
  USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Documents
DROP POLICY IF EXISTS "Students can view public documents" ON documents;
CREATE POLICY "Students can view public documents"
  ON documents FOR SELECT TO authenticated
  USING (is_public = true OR uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Students can upload own documents" ON documents;
CREATE POLICY "Students can upload own documents"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND get_my_role() = 'student');

DROP POLICY IF EXISTS "Teachers can view all class documents" ON documents;
CREATE POLICY "Teachers can view all class documents"
  ON documents FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Teachers can upload documents" ON documents;
CREATE POLICY "Teachers can upload documents"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND get_my_role() = 'teacher');

DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
CREATE POLICY "Admins can manage all documents"
  ON documents FOR ALL TO authenticated
  USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Quizzes
DROP POLICY IF EXISTS "Students can view active quizzes" ON quizzes;
CREATE POLICY "Students can view active quizzes"
  ON quizzes FOR SELECT TO authenticated
  USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

DROP POLICY IF EXISTS "Teachers can view all quizzes" ON quizzes;
CREATE POLICY "Teachers can view all quizzes"
  ON quizzes FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Teachers can create quizzes" ON quizzes;
CREATE POLICY "Teachers can create quizzes"
  ON quizzes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND get_my_role() = 'teacher');

DROP POLICY IF EXISTS "Admins can manage all quizzes" ON quizzes;
CREATE POLICY "Admins can manage all quizzes"
  ON quizzes FOR ALL TO authenticated
  USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Quiz Questions
DROP POLICY IF EXISTS "Students can view active quiz questions" ON quiz_questions;
CREATE POLICY "Students can view active quiz questions"
  ON quiz_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.is_active = true));

DROP POLICY IF EXISTS "Teachers can manage quiz questions" ON quiz_questions;
CREATE POLICY "Teachers can manage quiz questions"
  ON quiz_questions FOR ALL TO authenticated
  USING (get_my_role() IN ('teacher', 'admin')) WITH CHECK (get_my_role() IN ('teacher', 'admin'));

-- Quiz Attempts
DROP POLICY IF EXISTS "Students can view own attempts" ON quiz_attempts;
CREATE POLICY "Students can view own attempts"
  ON quiz_attempts FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can create own attempts" ON quiz_attempts;
CREATE POLICY "Students can create own attempts"
  ON quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND get_my_role() = 'student');

DROP POLICY IF EXISTS "Teachers can view all attempts" ON quiz_attempts;
CREATE POLICY "Teachers can view all attempts"
  ON quiz_attempts FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));

-- Quiz Responses
DROP POLICY IF EXISTS "Students can view own responses" ON quiz_responses;
CREATE POLICY "Students can view own responses"
  ON quiz_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_responses.attempt_id AND quiz_attempts.student_id = auth.uid()));

DROP POLICY IF EXISTS "Students can create own responses" ON quiz_responses;
CREATE POLICY "Students can create own responses"
  ON quiz_responses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_responses.attempt_id AND quiz_attempts.student_id = auth.uid()));

DROP POLICY IF EXISTS "Teachers can view all responses" ON quiz_responses;
CREATE POLICY "Teachers can view all responses"
  ON quiz_responses FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));

-- Achievements
DROP POLICY IF EXISTS "Students can view own achievements" ON achievements;
CREATE POLICY "Students can view own achievements"
  ON achievements FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view all achievements" ON achievements;
CREATE POLICY "Teachers can view all achievements"
  ON achievements FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Teachers can create achievements" ON achievements;
CREATE POLICY "Teachers can create achievements"
  ON achievements FOR INSERT TO authenticated
  WITH CHECK (awarded_by = auth.uid() AND get_my_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Admins can manage all achievements" ON achievements;
CREATE POLICY "Admins can manage all achievements"
  ON achievements FOR ALL TO authenticated
  USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- ============================================================
-- 7. Auto-create Profile Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);

-- ============================================================
-- 9. Seed Admin Account
-- ============================================================
INSERT INTO public.profiles (id, full_name, role)
SELECT id, 'Admin', 'admin'
FROM auth.users
WHERE email = 'admin@akgroup.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Admin';

-- ============================================================
-- 10. Seed Classes
-- ============================================================
INSERT INTO classes (id, name, grade, section) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Class 1 - Section A',  1,  'A'),
  ('c1000000-0000-0000-0000-000000000002', 'Class 2 - Section A',  2,  'A'),
  ('c1000000-0000-0000-0000-000000000003', 'Class 3 - Section A',  3,  'A'),
  ('c1000000-0000-0000-0000-000000000004', 'Class 4 - Section A',  4,  'A'),
  ('c1000000-0000-0000-0000-000000000005', 'Class 5 - Section A',  5,  'A'),
  ('c1000000-0000-0000-0000-000000000006', 'Class 6 - Section A',  6,  'A'),
  ('c1000000-0000-0000-0000-000000000007', 'Class 7 - Section A',  7,  'A'),
  ('c1000000-0000-0000-0000-000000000008', 'Class 8 - Section A',  8,  'A'),
  ('c1000000-0000-0000-0000-000000000009', 'Class 9 - Section A',  9,  'A'),
  ('c1000000-0000-0000-0000-000000000010', 'Class 10 - Section A', 10, 'A')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. Seed 70 Teachers + 200 Students
--     Password for all: AKGroup@2024
-- ============================================================
DO $$
DECLARE
  male_first   text[] := ARRAY[
    'Arjun','Rahul','Vikram','Suresh','Anil','Kiran','Ravi','Sanjay','Deepak',
    'Manoj','Ajay','Vijay','Naveen','Praveen','Ramesh','Ganesh','Rajesh','Dinesh',
    'Harish','Mahesh','Naresh','Umesh','Lokesh','Mukesh','Rakesh','Kamlesh',
    'Hitesh','Ritesh','Jitesh','Paresh','Brijesh','Yogesh','Rupesh','Nilesh',
    'Chirag','Nikhil','Rohit','Mohit','Sumit','Amit','Ankit','Ankur','Manish',
    'Danish','Satish','Ashish','Girish','Shirish','Prashant','Shashank'
  ];
  female_first text[] := ARRAY[
    'Priya','Divya','Ananya','Sneha','Pooja','Kavya','Shruti','Anusha','Deepa',
    'Meena','Rekha','Usha','Asha','Nisha','Ritha','Geeta','Seema','Reema',
    'Neha','Preeti','Swati','Jyoti','Rati','Kriti','Aditi','Smriti','Bhavna',
    'Shobha','Sudha','Vidya','Lalita','Savita','Sunita','Mamta','Shanta',
    'Vandana','Archana','Kalpana','Ranjana','Sujana','Anjana','Roshani',
    'Pallavi','Madhavi','Revathi','Ramya','Hema','Latha','Vijaya','Nirmala'
  ];
  last_names   text[] := ARRAY[
    'Kumar','Sharma','Reddy','Patel','Nair','Rao','Singh','Gupta','Verma',
    'Mishra','Pandey','Joshi','Trivedi','Mehta','Shah','Desai','Pillai',
    'Menon','Iyer','Naidu','Varma','Yadav','Tiwari','Dubey','Chauhan',
    'Rathore','Bhatt','Saxena','Agarwal','Bansal','Goel','Kapoor','Malhotra',
    'Sinha','Bose','Das','Datta','Ghosh','Sen','Chatterjee'
  ];
  phones text[] := ARRAY[
    '98','97','96','95','94','93','92','91','90','89','88','87','86','85','84'
  ];
  i          int;
  uid        uuid;
  fname      text;
  lname      text;
  v_full_name text;
  email_addr text;
  phone_num  text;
  class_uuid uuid;
BEGIN

  -- ── 70 Teachers ──────────────────────────────────────────
  FOR i IN 1..70 LOOP
    uid     := gen_random_uuid();
    IF i % 2 = 0 THEN
      fname := female_first[1 + ((i - 1) % array_length(female_first,1))];
    ELSE
      fname := male_first[1 + ((i - 1) % array_length(male_first,1))];
    END IF;
    lname      := last_names[1 + ((i - 1) % array_length(last_names,1))];
    v_full_name := fname || ' ' || lname;
    email_addr := lower(fname) || '.' || lower(lname) || i || '@akgroup.edu.in';
    phone_num  := phones[1 + ((i-1) % array_length(phones,1))] || lpad(i::text, 8, '0');

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = email_addr) THEN
      INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, confirmation_token, recovery_token
      ) VALUES (
        uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        email_addr,
        crypt('AKGroup@2024', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_full_name, 'role', 'teacher'),
        false, '', ''
      );
      UPDATE profiles SET
        full_name = v_full_name,
        phone     = phone_num,
        role      = 'teacher'
      WHERE id = uid;
    END IF;
  END LOOP;

  -- ── 200 Students ─────────────────────────────────────────
  FOR i IN 1..200 LOOP
    uid     := gen_random_uuid();
    IF i % 2 = 0 THEN
      fname := female_first[1 + ((i - 1) % array_length(female_first,1))];
    ELSE
      fname := male_first[1 + ((i - 1) % array_length(male_first,1))];
    END IF;
    lname      := last_names[1 + ((i + 10 - 1) % array_length(last_names,1))];
    v_full_name := fname || ' ' || lname;
    email_addr := lower(fname) || '.s' || lpad(i::text,3,'0') || '@student.akgroup.edu.in';
    phone_num  := phones[1 + ((i+3-1) % array_length(phones,1))] || lpad((i+1000)::text, 8, '0');
    class_uuid := ('c1000000-0000-0000-0000-' || lpad(((((i-1) % 10) + 1)::text), 12, '0'))::uuid;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = email_addr) THEN
      INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, confirmation_token, recovery_token
      ) VALUES (
        uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        email_addr,
        crypt('AKGroup@2024', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_full_name, 'role', 'student'),
        false, '', ''
      );
      UPDATE profiles SET
        full_name = v_full_name,
        phone     = phone_num,
        role      = 'student',
        class_id  = class_uuid
      WHERE id = uid;
    END IF;
  END LOOP;

END $$;

-- ============================================================
-- 12. Subjects (5 per class = 50 total, assigned to teachers)
-- ============================================================
INSERT INTO subjects (id, name, class_id, teacher_id)
SELECT
  gen_random_uuid(),
  sub_name,
  c.id,
  (SELECT p.id FROM profiles p WHERE p.role = 'teacher'
   ORDER BY p.created_at
   OFFSET ((c.grade - 1) * 7 + sub_idx) % GREATEST((SELECT COUNT(*) FROM profiles WHERE role = 'teacher'), 1)
   LIMIT 1
  )
FROM classes c
CROSS JOIN (VALUES
  (1, 'Mathematics'),
  (2, 'Science'),
  (3, 'English'),
  (4, 'Telugu'),
  (5, 'Social Studies')
) AS subs(sub_idx, sub_name)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Summary
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'student') AS total_students,
  (SELECT COUNT(*) FROM profiles WHERE role = 'teacher') AS total_teachers,
  (SELECT COUNT(*) FROM classes)                          AS total_classes,
  (SELECT COUNT(*) FROM subjects)                         AS total_subjects;

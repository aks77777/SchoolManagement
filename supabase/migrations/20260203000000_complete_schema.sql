/*
  # School Management System - Complete & Fixed Schema
  
  This is the consolidated schema for the School Management System.
  It includes:
  1. All table definitions (profiles, classes, etc.)
  2. Security Helper Function (`get_my_role`) to prevent infinite RLS recursion.
  3. Corrected RLS Policies for all tables.
  4. Fixes for Signup (Insert permissions).
*/

-- 1. Helper Function for Secure Role Checking
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

-- 2. Create Types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE document_category AS ENUM ('tc', 'bonafide', 'agreement', 'notes', 'marksheet', 'answer_sheet', 'other');
CREATE TYPE achievement_category AS ENUM ('academic', 'sports', 'cultural', 'other');

-- 3. Create Tables

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
  full_name text NOT NULL,
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

-- 4. Enable RLS
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

-- 5. Grant Permissions
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role TO anon;

-- 6. Apply Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR get_my_role() = 'admin' OR get_my_role() = 'teacher');
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Classes
CREATE POLICY "Authenticated users can view classes" ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage classes" ON classes FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Subjects
CREATE POLICY "Authenticated users can view subjects" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Periods
CREATE POLICY "Authenticated users can view periods" ON periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage periods" ON periods FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Attendance
CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Teachers can view class attendance" ON attendance FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));
CREATE POLICY "Teachers can mark attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'teacher');
CREATE POLICY "Teachers can update attendance" ON attendance FOR UPDATE TO authenticated USING (get_my_role() = 'teacher') WITH CHECK (get_my_role() = 'teacher');
CREATE POLICY "Admins can manage all attendance" ON attendance FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Documents
CREATE POLICY "Students can view public documents" ON documents FOR SELECT TO authenticated USING (is_public = true OR uploaded_by = auth.uid());
CREATE POLICY "Students can upload own documents" ON documents FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND get_my_role() = 'student');
CREATE POLICY "Teachers can view all class documents" ON documents FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));
CREATE POLICY "Teachers can upload documents" ON documents FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND get_my_role() = 'teacher');
CREATE POLICY "Admins can manage all documents" ON documents FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Quizzes
CREATE POLICY "Students can view active quizzes" ON quizzes FOR SELECT TO authenticated USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY "Teachers can view all quizzes" ON quizzes FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));
CREATE POLICY "Teachers can create quizzes" ON quizzes FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND get_my_role() = 'teacher');
CREATE POLICY "Admins can manage all quizzes" ON quizzes FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Quiz Questions
CREATE POLICY "Students can view active quiz questions" ON quiz_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.is_active = true));
CREATE POLICY "Teachers can manage quiz questions" ON quiz_questions FOR ALL TO authenticated USING (get_my_role() IN ('teacher', 'admin')) WITH CHECK (get_my_role() IN ('teacher', 'admin'));

-- Quiz Attempts
CREATE POLICY "Students can view own attempts" ON quiz_attempts FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students can create own attempts" ON quiz_attempts FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND get_my_role() = 'student');
CREATE POLICY "Teachers can view all attempts" ON quiz_attempts FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));

-- Quiz Responses
CREATE POLICY "Students can view own responses" ON quiz_responses FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_responses.attempt_id AND quiz_attempts.student_id = auth.uid()));
CREATE POLICY "Students can create own responses" ON quiz_responses FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_responses.attempt_id AND quiz_attempts.student_id = auth.uid()));
CREATE POLICY "Teachers can view all responses" ON quiz_responses FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));

-- Achievements
CREATE POLICY "Students can view own achievements" ON achievements FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Teachers can view all achievements" ON achievements FOR SELECT TO authenticated USING (get_my_role() IN ('teacher', 'admin'));
CREATE POLICY "Teachers can create achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (awarded_by = auth.uid() AND get_my_role() IN ('teacher', 'admin'));
CREATE POLICY "Admins can manage all achievements" ON achievements FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);
-- (Add other indexes as needed)

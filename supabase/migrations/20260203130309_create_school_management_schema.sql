/*
  # School Management System - Complete Database Schema

  ## Overview
  This migration creates a comprehensive school management system with support for
  multi-role authentication (Student, Teacher, Admin) and all core features.

  ## New Tables Created

  ### 1. profiles
  Extends auth.users with role and profile information
  - `id` (uuid, FK to auth.users)
  - `role` (enum: student, teacher, admin)
  - `full_name` (text)
  - `phone` (text)
  - `class_id` (uuid, FK to classes) - for students
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. classes
  Manages class/section information
  - `id` (uuid, PK)
  - `name` (text) - e.g., "Class 10-A"
  - `grade` (int) - e.g., 10
  - `section` (text) - e.g., "A"
  - `created_at` (timestamptz)

  ### 3. subjects
  Stores subject information
  - `id` (uuid, PK)
  - `name` (text)
  - `class_id` (uuid, FK to classes)
  - `teacher_id` (uuid, FK to profiles)
  - `created_at` (timestamptz)

  ### 4. periods
  Manages period/timetable structure
  - `id` (uuid, PK)
  - `class_id` (uuid, FK to classes)
  - `subject_id` (uuid, FK to subjects)
  - `period_number` (int) - 1-8
  - `day_of_week` (int) - 1-7
  - `start_time` (time)
  - `end_time` (time)
  - `created_at` (timestamptz)

  ### 5. attendance
  Tracks student attendance per period
  - `id` (uuid, PK)
  - `student_id` (uuid, FK to profiles)
  - `period_id` (uuid, FK to periods)
  - `date` (date)
  - `status` (enum: present, absent, late)
  - `marked_by` (uuid, FK to profiles) - teacher who marked
  - `created_at` (timestamptz)

  ### 6. documents
  Manages all document uploads
  - `id` (uuid, PK)
  - `title` (text)
  - `description` (text)
  - `file_url` (text)
  - `file_type` (text)
  - `document_category` (enum: tc, bonafide, agreement, notes, marksheet, answer_sheet, other)
  - `uploaded_by` (uuid, FK to profiles)
  - `class_id` (uuid, FK to classes) - null for student documents
  - `subject_id` (uuid, FK to subjects) - null for non-subject documents
  - `is_public` (boolean) - visible to students
  - `created_at` (timestamptz)

  ### 7. quizzes
  Stores quiz information
  - `id` (uuid, PK)
  - `title` (text)
  - `description` (text)
  - `subject_id` (uuid, FK to subjects)
  - `created_by` (uuid, FK to profiles)
  - `duration_minutes` (int)
  - `total_marks` (int)
  - `is_active` (boolean)
  - `start_date` (timestamptz)
  - `end_date` (timestamptz)
  - `created_at` (timestamptz)

  ### 8. quiz_questions
  Stores quiz questions
  - `id` (uuid, PK)
  - `quiz_id` (uuid, FK to quizzes)
  - `question_text` (text)
  - `option_a` (text)
  - `option_b` (text)
  - `option_c` (text)
  - `option_d` (text)
  - `correct_option` (text)
  - `marks` (int)
  - `order_number` (int)
  - `created_at` (timestamptz)

  ### 9. quiz_attempts
  Tracks student quiz attempts
  - `id` (uuid, PK)
  - `quiz_id` (uuid, FK to quizzes)
  - `student_id` (uuid, FK to profiles)
  - `score` (int)
  - `total_marks` (int)
  - `started_at` (timestamptz)
  - `submitted_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 10. quiz_responses
  Stores individual question responses
  - `id` (uuid, PK)
  - `attempt_id` (uuid, FK to quiz_attempts)
  - `question_id` (uuid, FK to quiz_questions)
  - `selected_option` (text)
  - `is_correct` (boolean)
  - `created_at` (timestamptz)

  ### 11. achievements
  Tracks student achievements and ranks
  - `id` (uuid, PK)
  - `student_id` (uuid, FK to profiles)
  - `title` (text)
  - `description` (text)
  - `category` (enum: academic, sports, cultural, other)
  - `rank` (int)
  - `awarded_date` (date)
  - `awarded_by` (uuid, FK to profiles)
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Role-based policies for students, teachers, and admins
  - Students can view their own data
  - Teachers can manage their class/subject data
  - Admins have full access to all data
*/

-- Create enums
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE document_category AS ENUM ('tc', 'bonafide', 'agreement', 'notes', 'marksheet', 'answer_sheet', 'other');
CREATE TYPE achievement_category AS ENUM ('academic', 'sports', 'cultural', 'other');

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade int NOT NULL,
  section text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name text NOT NULL,
  phone text,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create periods table
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

-- Create attendance table
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

-- Create documents table
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

-- Create quizzes table
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

-- Create quiz_questions table
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

-- Create quiz_attempts table
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

-- Create quiz_responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES quiz_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option text,
  is_correct boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_selected_option CHECK (selected_option IN ('A', 'B', 'C', 'D'))
);

-- Create achievements table
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

-- Enable Row Level Security
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

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Classes policies
CREATE POLICY "Authenticated users can view classes"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Subjects policies
CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can view their subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
  );

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Periods policies
CREATE POLICY "Authenticated users can view periods"
  ON periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage periods"
  ON periods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Attendance policies
CREATE POLICY "Students can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view class attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can mark attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Admins can manage all attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Documents policies
CREATE POLICY "Students can view public documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "Students can upload own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );

CREATE POLICY "Teachers can view all class documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Admins can manage all documents"
  ON documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Quizzes policies
CREATE POLICY "Students can view active quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND start_date <= now()
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Teachers can view all quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can create quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can manage all quizzes"
  ON quizzes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Quiz questions policies
CREATE POLICY "Students can view active quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.is_active = true
      AND quizzes.start_date <= now()
      AND (quizzes.end_date IS NULL OR quizzes.end_date >= now())
    )
  );

CREATE POLICY "Teachers can manage quiz questions"
  ON quiz_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Quiz attempts policies
CREATE POLICY "Students can view own attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create own attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );

CREATE POLICY "Students can update own attempts"
  ON quiz_attempts FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view all attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Quiz responses policies
CREATE POLICY "Students can view own responses"
  ON quiz_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_responses.attempt_id
      AND quiz_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own responses"
  ON quiz_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_responses.attempt_id
      AND quiz_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view all responses"
  ON quiz_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Achievements policies
CREATE POLICY "Students can view own achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view all achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can create achievements"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (
    awarded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Admins can manage all achievements"
  ON achievements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_periods_class_id ON periods(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_class_id ON documents(class_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_student_id ON achievements(student_id);

export type UserRole = 'student' | 'teacher' | 'admin';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type DocumentCategory = 'tc' | 'bonafide' | 'agreement' | 'notes' | 'marksheet' | 'answer_sheet' | 'other';
export type AchievementCategory = 'academic' | 'sports' | 'cultural' | 'other';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  class_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  grade: number;
  section: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  class_id: string;
  teacher_id: string | null;
  created_at: string;
}

export interface Period {
  id: string;
  class_id: string;
  subject_id: string;
  period_number: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  period_id: string;
  date: string;
  status: AttendanceStatus;
  marked_by: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  document_category: DocumentCategory;
  uploaded_by: string;
  class_id: string | null;
  subject_id: string | null;
  is_public: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  created_by: string;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  order_number: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_marks: number;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
}

export interface QuizResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  category: AchievementCategory;
  rank: number | null;
  awarded_date: string;
  awarded_by: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      classes: {
        Row: Class;
        Insert: Omit<Class, 'id' | 'created_at'>;
        Update: Partial<Omit<Class, 'id' | 'created_at'>>;
      };
      subjects: {
        Row: Subject;
        Insert: Omit<Subject, 'id' | 'created_at'>;
        Update: Partial<Omit<Subject, 'id' | 'created_at'>>;
      };
      periods: {
        Row: Period;
        Insert: Omit<Period, 'id' | 'created_at'>;
        Update: Partial<Omit<Period, 'id' | 'created_at'>>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id' | 'created_at'>;
        Update: Partial<Omit<Attendance, 'id' | 'created_at'>>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'id' | 'created_at'>;
        Update: Partial<Omit<Document, 'id' | 'created_at'>>;
      };
      quizzes: {
        Row: Quiz;
        Insert: Omit<Quiz, 'id' | 'created_at'>;
        Update: Partial<Omit<Quiz, 'id' | 'created_at'>>;
      };
      quiz_questions: {
        Row: QuizQuestion;
        Insert: Omit<QuizQuestion, 'id' | 'created_at'>;
        Update: Partial<Omit<QuizQuestion, 'id' | 'created_at'>>;
      };
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: Omit<QuizAttempt, 'id' | 'created_at'>;
        Update: Partial<Omit<QuizAttempt, 'id' | 'created_at'>>;
      };
      quiz_responses: {
        Row: QuizResponse;
        Insert: Omit<QuizResponse, 'id' | 'created_at'>;
        Update: Partial<Omit<QuizResponse, 'id' | 'created_at'>>;
      };
      achievements: {
        Row: Achievement;
        Insert: Omit<Achievement, 'id' | 'created_at'>;
        Update: Partial<Omit<Achievement, 'id' | 'created_at'>>;
      };
    };
  };
}

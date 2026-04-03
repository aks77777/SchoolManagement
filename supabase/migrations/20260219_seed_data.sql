/*
  Seed Data: 10 Classes, 70 Teachers, 200 Students
  Run AFTER the main migration (20260218_complete_schema_with_trigger.sql).

  All accounts use password: AKGroup@2024
  (stored as a bcrypt hash via crypt())

  Steps:
    1. Inserts auth.users for all teachers and students
    2. Updates auto-created profiles with full details (phone, class, etc.)
    3. Creates 10 classes and 50 subjects
    4. Assigns teachers to subjects
*/

-- ============================================================
-- Helper: wrap everything in a transaction
-- ============================================================
BEGIN;

-- ============================================================
-- 1. Classes (10 classes, grades 1–10 Section A)
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
-- 2. Create auth users using a PL/pgSQL block
--    Password for all: AKGroup@2024
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
  role_val   text;
BEGIN

  -- ── 70 Teachers ──────────────────────────────────────────
  FOR i IN 1..70 LOOP
    uid     := gen_random_uuid();
    -- Alternate male/female
    IF i % 2 = 0 THEN
      fname := female_first[1 + ((i - 1) % array_length(female_first,1))];
    ELSE
      fname := male_first[1 + ((i - 1) % array_length(male_first,1))];
    END IF;
    lname      := last_names[1 + ((i - 1) % array_length(last_names,1))];
    v_full_name := fname || ' ' || lname;
    email_addr := lower(fname) || '.' || lower(lname) || i || '@akgroup.edu.in';
    phone_num  := phones[1 + ((i-1) % array_length(phones,1))] || lpad(i::text, 8, '0');

    -- Skip if email already exists
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

      -- Update profile created by trigger
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

    -- Distribute students across 10 classes (~20 per class)
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

      -- Update profile
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
-- 3. Subjects (5 subjects per class = 50 total)
--    Assign to first available teacher per class group
-- ============================================================
INSERT INTO subjects (id, name, class_id, teacher_id)
SELECT
  gen_random_uuid(),
  sub_name,
  c.id AS class_id,
  -- Pick a teacher for this class (cycle through teachers)
  (SELECT p.id FROM profiles p WHERE p.role = 'teacher'
   ORDER BY p.created_at
   OFFSET ((c.grade - 1) * 7 + sub_idx) % (SELECT COUNT(*) FROM profiles WHERE role = 'teacher')
   LIMIT 1
  ) AS teacher_id
FROM classes c
CROSS JOIN (VALUES
  (1, 'Mathematics'),
  (2, 'Science'),
  (3, 'English'),
  (4, 'Telugu'),
  (5, 'Social Studies')
) AS subs(sub_idx, sub_name)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================
-- Summary
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'student') AS total_students,
  (SELECT COUNT(*) FROM profiles WHERE role = 'teacher') AS total_teachers,
  (SELECT COUNT(*) FROM classes)                          AS total_classes,
  (SELECT COUNT(*) FROM subjects)                         AS total_subjects;

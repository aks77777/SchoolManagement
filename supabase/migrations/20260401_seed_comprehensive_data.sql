-- Seed Script for School Management System
-- This script generates Classes 1-10 (A, B, C sections), 
-- creates subjects (Mathematics, Science, Social Sciences, Telugu, Hindi, English),
-- and populates students and teacher profiles.

-- 1. Create Classes (1A to 10C)
DO $$
DECLARE
    g int;
    s text;
    class_name text;
BEGIN
    FOR g IN 1..10 LOOP
        FOR s IN SELECT unnest(ARRAY['A', 'B', 'C']) LOOP
            class_name := 'Class ' || g || s;
            INSERT INTO classes (name, grade, section)
            VALUES (class_name, g, s)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 2. Create Subjects for every class
DO $$
DECLARE
    subject_names text[] := ARRAY['Mathematics', 'Science', 'Social Sciences', 'Telugu', 'Hindi', 'English'];
    subj text;
    class_rec RECORD;
BEGIN
    FOR class_rec IN SELECT id FROM classes LOOP
        FOREACH subj IN ARRAY subject_names LOOP
            INSERT INTO subjects (name, class_id)
            VALUES (subj, class_rec.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- NOTE: To fully seed students and teachers, actual auth.users records are needed.
-- It's recommended to create these via the Supabase Auth Dashboard or a registration script.
-- For the demo/mocking, the UI will fall back to a rich set of fake students if the database is empty.

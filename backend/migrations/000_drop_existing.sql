-- This migration will drop and recreate the students table and its dependencies
-- WARNING: This will delete all existing data in the related tables
DO $$
BEGIN
    -- Drop the attendance table first since it has a foreign key to students
    DROP TABLE IF EXISTS attendance CASCADE;
    
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS update_students_updated_at ON students;
    
    -- Drop the function
    DROP FUNCTION IF EXISTS update_updated_at_column();
    
    -- Drop the students table with CASCADE to drop any depending objects
    DROP TABLE IF EXISTS students CASCADE;
    
    -- Drop the index if it exists
    DROP INDEX IF EXISTS idx_students_email;
    
    RAISE NOTICE 'Dropped students table and all related objects';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during cleanup: %', SQLERRM;
END $$;

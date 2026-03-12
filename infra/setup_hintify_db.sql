-- Setup script for Hintify database
-- Run this after creating the hintify database

-- Create app_owner role if it doesn't exist
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_owner') THEN
      CREATE ROLE app_owner WITH LOGIN PASSWORD 'ChangeMe123!';
   END IF;
END
$$;

-- Grant all privileges on hintify database to app_owner
GRANT ALL PRIVILEGES ON DATABASE hintify TO app_owner;

-- Connect to hintify database and create tables
\connect hintify;

-- Create hints_log table
CREATE TABLE IF NOT EXISTS hints_log (
  id SERIAL PRIMARY KEY,
  question_id INTEGER,
  hint_level INTEGER,
  user_id INTEGER NULL,
  generated_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant table privileges to app_owner
GRANT ALL PRIVILEGES ON TABLE hints_log TO app_owner;
GRANT USAGE, SELECT ON SEQUENCE hints_log_id_seq TO app_owner;

-- Optional: Create questions table (for future use if moving from JSON)
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255),
  question_text TEXT NOT NULL,
  options JSONB,
  answer TEXT,
  hint1 TEXT,
  hint2 TEXT,
  solution TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL PRIVILEGES ON TABLE questions TO app_owner;
GRANT USAGE, SELECT ON SEQUENCE questions_id_seq TO app_owner;

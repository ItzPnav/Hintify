-- Create the app database and owner if not exists
-- NOTE: This script is executed as the default postgres user

-- create DB
CREATE DATABASE hintify_AI_qa_web;

-- create user (app_owner) with password
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_owner') THEN
      CREATE ROLE app_owner WITH LOGIN PASSWORD 'ChangeMe123!';
   END IF;
END
$$;

-- grant privileges
GRANT ALL PRIVILEGES ON DATABASE hintify_AI_qa_web TO app_owner;

-- Connect to the app DB
\connect hintify_AI_qa_web;

-- Hint log table
CREATE TABLE IF NOT EXISTS hints_log (
  id SERIAL PRIMARY KEY,
  question_id INTEGER,
  hint_level INTEGER,
  user_id INTEGER NULL,
  generated_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PDF documents table — stores the raw PDF binary so students can view it
CREATE TABLE IF NOT EXISTS pdf_documents (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  data BYTEA NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_owner;
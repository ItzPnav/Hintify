-- Create the app database and owner if not exists
-- NOTE: This script is executed as the default postgres user

-- Create DB
CREATE DATABASE hintify_lanjha;

-- Create user (app_owner) with password
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_owner') THEN
      CREATE ROLE app_owner WITH LOGIN PASSWORD 'ChangeMe123!';
   END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hintify TO app_owner;

-- Connect to the app DB and create a simple hints log table
\connect hintify;

CREATE TABLE IF NOT EXISTS hints_log (
  id SERIAL PRIMARY KEY,
  question_id INTEGER,
  hint_level INTEGER,
  user_id INTEGER NULL,
  generated_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- init-db.sql
-- This script is executed by Docker Compose to initialize the database.

-- Create the 'auth' database if it doesn't exist
SELECT 'CREATE DATABASE auth'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth')\gexec

-- Connect to the 'auth' database and run the migration
\c auth;

-- Run the initial schema migration
-- This assumes the migration file is already copied into the container
-- and TypeORM will pick it up and run it.
-- For manual execution, you would run the SQL directly or use TypeORM CLI.
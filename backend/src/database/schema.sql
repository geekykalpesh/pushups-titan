-- =======================================================
-- PUSHUPS & NUTRITION TRACKER - DATABASE SCHEMA
-- Compatible with PostgreSQL 12+ and pgAdmin 4
-- =======================================================

-- Users table with Passcode (PIN) and standard credentials
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255),
    daily_pushup_goal INT DEFAULT 100,
    daily_egg_goal INT DEFAULT 4,
    daily_protein_goal NUMERIC(6, 2) DEFAULT 30.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pushup logs table (Tracks every set with exact timestamp, date, count)
CREATE TABLE IF NOT EXISTS pushup_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    count INT NOT NULL CHECK (count > 0),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    log_date DATE DEFAULT CURRENT_DATE,
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Egg & Protein logs table (Tracks eggs eaten and calculates protein)
CREATE TABLE IF NOT EXISTS egg_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    count INT NOT NULL CHECK (count > 0),
    protein_grams NUMERIC(6, 2) NOT NULL DEFAULT 6.3,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    log_date DATE DEFAULT CURRENT_DATE,
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pushup Reminders & Alarms table
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) DEFAULT 'Pushup Alert! Drop & Give Me 20',
    reminder_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    target_count INT DEFAULT 20,
    days_of_week VARCHAR(50) DEFAULT '1,2,3,4,5,6,7',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pushup_user_date ON pushup_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_egg_user_date ON egg_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);

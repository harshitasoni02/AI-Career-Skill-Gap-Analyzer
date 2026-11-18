-- ============================================================
-- database_schema.sql — MySQL setup guide + reference schema
-- ============================================================
--
-- RIGHT NOW the app runs on SQLite (zero installation).
-- When you're ready to switch to MySQL (for the demo/viva), do this:
--
-- STEP 1. Install MySQL Server + MySQL Workbench from
--         https://dev.mysql.com/downloads/installer/
--         (Choose the "Developer Default" setup; remember your root password!)
--
-- STEP 2. Open MySQL Workbench (or the mysql command line) and run:
--
CREATE DATABASE IF NOT EXISTS skill_analyzer CHARACTER SET utf8mb4;
--
-- STEP 3. In backend/config.py, change SQLALCHEMY_DATABASE_URI to:
--         "mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/skill_analyzer"
--
-- STEP 4. Restart the Flask server. SQLAlchemy's db.create_all() will
--         create these two tables automatically — you don't even need
--         to run the SQL below by hand. It is included here for your
--         documentation/viva and in case you want to create them manually.
--
-- STEP 5. Verify: in MySQL Workbench run  SHOW TABLES;  you should see
--         'users' and 'analyses' inside the skill_analyzer database.

USE skill_analyzer;

CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(120)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,   -- NEVER the real password!
    created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analyses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT           NULL,          -- NULL = analysis by a guest
    module_type VARCHAR(20)   NOT NULL,      -- 'student' or 'recruiter'
    job_title   VARCHAR(200)  NULL,
    score       FLOAT         NULL,          -- skill-match percentage
    payload     JSON          NOT NULL,      -- full result saved as JSON
    created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

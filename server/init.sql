-- Создание таблиц для МЧС Tracker

CREATE TABLE IF NOT EXISTS objects (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    address TEXT NOT NULL,
    object_photo TEXT,
    description TEXT,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    object_type VARCHAR(100),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
    id VARCHAR(255) PRIMARY KEY,
    object_id VARCHAR(255) NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
    visit_date TIMESTAMP NOT NULL,
    visit_type VARCHAR(100) NOT NULL,
    comment TEXT,
    created_by VARCHAR(255),
    created_by_role VARCHAR(50),
    is_locked BOOLEAN DEFAULT TRUE,
    task_description TEXT,
    task_completed BOOLEAN,
    task_completed_by VARCHAR(255),
    task_completed_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    visit_id VARCHAR(255) NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_visits_object_id ON visits(object_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_visit_id ON photos(visit_id);
CREATE INDEX IF NOT EXISTS idx_objects_archived ON objects(is_archived);
CREATE INDEX IF NOT EXISTS idx_visits_archived ON visits(is_archived);

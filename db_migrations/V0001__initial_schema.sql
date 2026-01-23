-- Создание таблиц для системы учёта посещений МЧС

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('technician', 'director')),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица объектов
CREATE TABLE IF NOT EXISTS objects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица посещений (акты, защищены от редактирования)
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    object_id INTEGER NOT NULL REFERENCES objects(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    visit_date DATE NOT NULL,
    visit_type VARCHAR(20) NOT NULL CHECK (visit_type IN ('planned', 'unplanned')),
    comment TEXT NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT TRUE
);

-- Таблица фотографий
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER NOT NULL REFERENCES visits(id),
    photo_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица аудит-лога (логирование всех изменений)
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    changed_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_visits_object_id ON visits(object_id);
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_photos_visit_id ON photos(visit_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Вставка тестовых пользователей (пароли: tech и director)
INSERT INTO users (username, password_hash, full_name, role, email) VALUES
('tech', '$2b$10$abcdefghijklmnopqrstuv', 'Техник', 'technician', 'tech@example.com'),
('director', '$2b$10$abcdefghijklmnopqrstuv', 'Директор', 'director', 'director@example.com')
ON CONFLICT (username) DO NOTHING;

-- Вставка тестовых объектов
INSERT INTO objects (name, address) VALUES
('ТЦ "Галерея"', 'ул. Ленина, 45'),
('Офисный центр "Сити"', 'пр. Мира, 12'),
('Склад "Логистик+"', 'ул. Промышленная, 8'),
('Бизнес-центр "Альфа"', 'ул. Гагарина, 23')
ON CONFLICT DO NOTHING;
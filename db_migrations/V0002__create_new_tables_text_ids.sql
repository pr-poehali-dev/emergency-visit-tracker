CREATE TABLE t_p32730230_emergency_visit_trac.objects_v2 (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    object_photo TEXT,
    object_type TEXT,
    is_archived BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE t_p32730230_emergency_visit_trac.visits_v2 (
    id TEXT PRIMARY KEY,
    object_id TEXT NOT NULL,
    user_id INTEGER,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    visit_type TEXT NOT NULL,
    comment TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    is_locked BOOLEAN,
    task_description TEXT,
    task_completed BOOLEAN,
    task_completed_by TEXT,
    task_completed_at TIMESTAMP WITH TIME ZONE,
    sms_notifications JSONB
);

CREATE TABLE t_p32730230_emergency_visit_trac.photos_v2 (
    id SERIAL PRIMARY KEY,
    visit_id TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_objects_v2_archived ON t_p32730230_emergency_visit_trac.objects_v2(is_archived);
CREATE INDEX idx_visits_v2_object ON t_p32730230_emergency_visit_trac.visits_v2(object_id);
CREATE INDEX idx_visits_v2_type ON t_p32730230_emergency_visit_trac.visits_v2(visit_type);
CREATE INDEX idx_photos_v2_visit ON t_p32730230_emergency_visit_trac.photos_v2(visit_id);
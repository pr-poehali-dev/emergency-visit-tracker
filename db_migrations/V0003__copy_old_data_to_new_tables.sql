INSERT INTO t_p32730230_emergency_visit_trac.objects_v2 (id, name, address, created_at, updated_at)
SELECT 
    CAST(id AS TEXT),
    name,
    address,
    created_at,
    updated_at
FROM t_p32730230_emergency_visit_trac.objects
WHERE NOT EXISTS (
    SELECT 1 FROM t_p32730230_emergency_visit_trac.objects_v2 
    WHERE objects_v2.id = CAST(objects.id AS TEXT)
);

INSERT INTO t_p32730230_emergency_visit_trac.visits_v2 (id, object_id, user_id, visit_date, visit_type, comment, created_by, created_at, is_locked)
SELECT 
    CAST(id AS TEXT),
    CAST(object_id AS TEXT),
    user_id,
    CAST(visit_date AS TIMESTAMP WITH TIME ZONE),
    visit_type,
    comment,
    created_by,
    created_at,
    is_locked
FROM t_p32730230_emergency_visit_trac.visits
WHERE NOT EXISTS (
    SELECT 1 FROM t_p32730230_emergency_visit_trac.visits_v2 
    WHERE visits_v2.id = CAST(visits.id AS TEXT)
);

INSERT INTO t_p32730230_emergency_visit_trac.photos_v2 (visit_id, photo_url, uploaded_at)
SELECT 
    CAST(visit_id AS TEXT),
    photo_url,
    uploaded_at
FROM t_p32730230_emergency_visit_trac.photos
WHERE NOT EXISTS (
    SELECT 1 FROM t_p32730230_emergency_visit_trac.photos_v2 
    WHERE photos_v2.visit_id = CAST(photos.visit_id AS TEXT) 
    AND photos_v2.photo_url = photos.photo_url
);
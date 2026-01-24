-- Устанавливаем created_at для всех визитов где он NULL
-- Используем visit_date как базу для created_at
UPDATE t_p32730230_emergency_visit_trac.visits_v2
SET created_at = COALESCE(visit_date, CURRENT_TIMESTAMP)
WHERE created_at IS NULL;

-- Добавляем поле task_recipient для указания кому адресована задача
ALTER TABLE t_p32730230_emergency_visit_trac.visits_v2 
ADD COLUMN IF NOT EXISTS task_recipient text NULL;

COMMENT ON COLUMN t_p32730230_emergency_visit_trac.visits_v2.task_recipient 
IS 'Получатель задачи: director или technician';

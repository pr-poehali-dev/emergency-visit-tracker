-- Добавляем поле phone для SMS-уведомлений
ALTER TABLE t_p32730230_emergency_visit_trac.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
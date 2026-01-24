-- Обновляем пароли на простые (для тестирования)
UPDATE t_p32730230_emergency_visit_trac.users 
SET password_hash = 'tech' 
WHERE username = 'tech';

UPDATE t_p32730230_emergency_visit_trac.users 
SET password_hash = 'director' 
WHERE username = 'director';
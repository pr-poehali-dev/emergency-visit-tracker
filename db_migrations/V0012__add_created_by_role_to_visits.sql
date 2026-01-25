-- Добавляем поле created_by_role для различия директора и руководителей
ALTER TABLE t_p32730230_emergency_visit_trac.visits_v2 
ADD COLUMN created_by_role TEXT CHECK (created_by_role IN ('technician', 'director', 'supervisor'));
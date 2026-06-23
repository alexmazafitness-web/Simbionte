-- Simbionte — seed mínimo (Fase 0)
-- IMPORTANTE: ejecutar este script DESPUÉS de iniciar sesión por primera vez
-- con el magic-link, ya que owner_id requiere un usuario existente en auth.users.
-- Como hoy solo hay un usuario, se toma automáticamente el primero (y único)
-- registro de auth.users.

insert into coaching.grupos_revision (owner_id, codigo, nombre, dia_semana)
select id, codigo, nombre, dia_semana
from auth.users, (
  values
    ('S1', 'Sábado A', 'sábado'),
    ('S2', 'Sábado B', 'sábado'),
    ('D1', 'Domingo A', 'domingo'),
    ('D2', 'Domingo B', 'domingo')
) as g(codigo, nombre, dia_semana)
limit 4;

insert into coaching.tarifas (owner_id, nombre, precio)
select id, nombre, precio
from auth.users, (
  values
    ('Básica', 115),
    ('Estándar', 300),
    ('Premium', 570),
    ('Elite', 1080)
) as p(nombre, precio)
limit 4;

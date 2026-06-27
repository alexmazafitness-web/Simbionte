-- Convierte el item directo FINANZAS en subsección con sus 6 subrutas

DO $$
DECLARE
  uid        uuid := '0bb273d1-de9f-494e-97b1-53bf87a0094b';
  s_personal uuid := 'a0000000-0000-0000-0000-000000000002';
  sub_fin    uuid := 'b0000000-0000-0000-0000-000000000005';
BEGIN
  -- 1. Borrar el item directo FINANZAS (subsection_id IS NULL, ruta /personal/finanzas)
  DELETE FROM personal.sidebar_items
  WHERE owner_id = uid
    AND section_id = s_personal
    AND subsection_id IS NULL
    AND ruta = '/personal/finanzas';

  -- 2. Crear la subsección FINANZAS
  INSERT INTO personal.sidebar_subsections (id, owner_id, section_id, nombre, orden, es_core)
  VALUES (sub_fin, uid, s_personal, 'Finanzas', 2, true)
  ON CONFLICT (id) DO NOTHING;

  -- 3. Insertar los 6 items bajo FINANZAS
  INSERT INTO personal.sidebar_items
    (id, owner_id, section_id, subsection_id, nombre, ruta, orden, es_core)
  VALUES
    ('c0000000-0000-0000-0000-000000000020', uid, s_personal, sub_fin, 'Resumen',       '/personal/finanzas',              1, true),
    ('c0000000-0000-0000-0000-000000000021', uid, s_personal, sub_fin, 'Transacciones', '/personal/finanzas/transacciones', 2, true),
    ('c0000000-0000-0000-0000-000000000022', uid, s_personal, sub_fin, 'Inversiones',   '/personal/finanzas/inversiones',   3, true),
    ('c0000000-0000-0000-0000-000000000023', uid, s_personal, sub_fin, 'Crypto',        '/personal/finanzas/crypto',        4, true),
    ('c0000000-0000-0000-0000-000000000024', uid, s_personal, sub_fin, 'Ahorro',        '/personal/finanzas/ahorro',        5, true),
    ('c0000000-0000-0000-0000-000000000025', uid, s_personal, sub_fin, 'Deudas',        '/personal/finanzas/deudas',        6, true)
  ON CONFLICT (id) DO NOTHING;
END $$;

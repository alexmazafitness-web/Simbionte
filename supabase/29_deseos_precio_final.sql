-- Precio final de compra: se pide al marcar un deseo como comprado, para
-- poder comparar contra el precio estimado y mostrar el ahorro/sobrecoste.

alter table personal.lista_deseos add column if not exists precio_final numeric(12,2);

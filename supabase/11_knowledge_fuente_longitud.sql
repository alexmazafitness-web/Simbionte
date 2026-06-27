alter table personal.kn_notes
  add column if not exists fuente_longitud text
    not null default 'corta'
    check (fuente_longitud in ('corta', 'larga'));

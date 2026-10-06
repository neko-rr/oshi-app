-- まつり(festival) を手帳(notebook) に置き換え。飾り字の本文は清潔のまま
update public.display_settings
  set font_pack = 'notebook'
  where font_pack = 'festival';

alter table public.display_settings
  drop constraint if exists display_settings_font_pack_check;
alter table public.display_settings
  add constraint display_settings_font_pack_check
  check (font_pack in (
    'clean',
    'soft',
    'magazine',
    'readable',
    'story',
    'notebook'
  ));

comment on column public.display_settings.font_pack is
  '文字パック（clean / soft / magazine / readable / story / notebook）';

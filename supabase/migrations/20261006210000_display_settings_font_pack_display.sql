-- 飾り字パック（見出し専用。本文は清潔ゴシックのまま）
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
    'festival'
  ));

comment on column public.display_settings.font_pack is
  '文字パック（clean / soft / magazine / readable / story / festival）';

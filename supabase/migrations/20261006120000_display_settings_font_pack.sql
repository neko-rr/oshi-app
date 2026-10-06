-- 見た目設定の文字パック（4種。OFL 埋め込みフォント。テーマ色とは独立）
alter table public.display_settings
  add column if not exists font_pack text not null default 'clean';

alter table public.display_settings
  drop constraint if exists display_settings_font_pack_check;
alter table public.display_settings
  add constraint display_settings_font_pack_check
  check (font_pack in ('clean', 'soft', 'magazine', 'readable'));

comment on column public.display_settings.font_pack is
  '文字パック（clean / soft / magazine / readable）';

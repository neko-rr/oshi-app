-- ギャラリーカードに載せる情報（名前／タグ／価格）の独立 ON/OFF
alter table public.display_settings
  add column if not exists gallery_show_name boolean not null default true,
  add column if not exists gallery_show_tags boolean not null default true,
  add column if not exists gallery_show_price boolean not null default true;

comment on column public.display_settings.gallery_show_name is
  'ギャラリーカードに製品名を表示するか';
comment on column public.display_settings.gallery_show_tags is
  'ギャラリーカードにカテゴリ／収納タグを表示するか';
comment on column public.display_settings.gallery_show_price is
  'ギャラリーカードに購入価格を表示するか';

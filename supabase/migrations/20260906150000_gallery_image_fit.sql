-- ギャラリー一覧の写真フィット（cover=切り抜き / contain=はみ出し少なめ）
alter table public.display_settings
  add column if not exists gallery_image_fit text not null default 'cover';

alter table public.display_settings
  drop constraint if exists display_settings_gallery_image_fit_check;
alter table public.display_settings
  add constraint display_settings_gallery_image_fit_check
  check (gallery_image_fit in ('cover', 'contain'));

comment on column public.display_settings.gallery_image_fit is
  'ギャラリー一覧の写真フィット（cover=枠に合わせて切る / contain=はみ出し少なめ）';

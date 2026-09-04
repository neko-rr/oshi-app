-- display_settings: 並び既定・ギャラリー表示・ログイン後着地
alter table public.display_settings
  add column if not exists list_sort text not null default 'newest',
  add column if not exists gallery_layout text not null default 'grid',
  add column if not exists landing_page text not null default 'home';

alter table public.display_settings
  drop constraint if exists display_settings_list_sort_check;
alter table public.display_settings
  add constraint display_settings_list_sort_check
  check (list_sort in ('newest', 'name', 'created_at'));

alter table public.display_settings
  drop constraint if exists display_settings_gallery_layout_check;
alter table public.display_settings
  add constraint display_settings_gallery_layout_check
  check (gallery_layout in ('grid', 'large', 'list'));

alter table public.display_settings
  drop constraint if exists display_settings_landing_page_check;
alter table public.display_settings
  add constraint display_settings_landing_page_check
  check (landing_page in ('home', 'gallery', 'register'));

comment on column public.display_settings.list_sort is
  '一覧の並び既定: newest / name / created_at';
comment on column public.display_settings.gallery_layout is
  'ギャラリー表示: grid / large / list';
comment on column public.display_settings.landing_page is
  'ログイン後の着地: home / gallery / register';

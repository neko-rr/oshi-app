-- ダブり土台: 手元に残す数と余剰の自動交換OK

alter table public.display_settings
  add column if not exists keep_at_hand_count smallint not null default 1,
  add column if not exists auto_sales_desired boolean not null default false;

alter table public.display_settings
  drop constraint if exists display_settings_keep_at_hand_count_check;

alter table public.display_settings
  add constraint display_settings_keep_at_hand_count_check
  check (keep_at_hand_count >= 1 and keep_at_hand_count <= 99);

comment on column public.display_settings.keep_at_hand_count is
  '手元に残したい所持数（1〜99）。余剰を交換OKにする判定に使う';
comment on column public.display_settings.auto_sales_desired is
  'ON のとき所持数 > 手元数なら交換OKを自動付与（手調整後は上書きしない）';

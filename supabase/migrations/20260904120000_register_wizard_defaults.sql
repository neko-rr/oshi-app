-- 登録ウィザード既定（開始手順・いつも選ぶ収納）+ 収納の登録回数
alter table public.display_settings
  add column if not exists register_start_step text not null default 'barcode',
  add column if not exists default_storage_location_id integer null;

alter table public.display_settings
  drop constraint if exists display_settings_register_start_step_check;
alter table public.display_settings
  add constraint display_settings_register_start_step_check
  check (register_start_step in ('barcode', 'photo', 'confirm'));

alter table public.display_settings
  drop constraint if exists display_settings_default_storage_location_id_fkey;
alter table public.display_settings
  add constraint display_settings_default_storage_location_id_fkey
  foreign key (default_storage_location_id)
  references public.storage_location (storage_location_id)
  on delete set null;

comment on column public.display_settings.register_start_step is
  '登録ウィザードの開始手順: barcode / photo / confirm';
comment on column public.display_settings.default_storage_location_id is
  'いつも選ぶ収納（null なら指定なし。削除時は SET NULL）';

alter table public.storage_location
  add column if not exists register_pick_count integer not null default 0,
  add column if not exists last_register_picked_at timestamptz null;

comment on column public.storage_location.register_pick_count is
  '登録ウィザードで選ばれた回数';
comment on column public.storage_location.last_register_picked_at is
  '登録ウィザードで最後に選ばれた日時（UTC）';

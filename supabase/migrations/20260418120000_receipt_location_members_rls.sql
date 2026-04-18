-- receipt_location をユーザー所有にし、プリセット slot 1..6 と追加行(slot NULL)を許可する

-- 1) 列追加（レガシー行は members_id が NULL のまま）
alter table public.receipt_location
  add column if not exists members_id uuid references auth.users(id) on delete cascade;

alter table public.receipt_location
  add column if not exists slot integer;

-- 2) レガシー行（members_id が NULL）を参照している商品の FK を外す
update public.registration_product_information rpi
set receipt_location_id = null
from public.receipt_location rl
where rpi.receipt_location_id = rl.receipt_location_id
  and rl.members_id is null;

-- 3) レガシー行のみ削除（再実行時はユーザー行を残す）
delete from public.receipt_location where members_id is null;

-- 4) 旧ポリシー除去
drop policy if exists "Allow all operations on receipt_location" on public.receipt_location;
drop policy if exists "Anyone can view receipt_location" on public.receipt_location;
drop policy if exists "Anyone can insert receipt_location" on public.receipt_location;
drop policy if exists "Anyone can update receipt_location" on public.receipt_location;
drop policy if exists "Anyone can delete receipt_location" on public.receipt_location;
drop policy if exists receipt_location_self_all on public.receipt_location;

-- 5) グローバル名ユニークを廃止
alter table public.receipt_location
  drop constraint if exists receipt_location_receipt_location_name_key;

drop index if exists public.idx_receipt_location_name;

-- 6) 新規行は必ず members_id 必須（既存ユーザー行のみ残っている想定）
alter table public.receipt_location
  alter column members_id set not null;

alter table public.receipt_location
  drop constraint if exists receipt_location_slot_range;

alter table public.receipt_location
  add constraint receipt_location_slot_range
  check (slot is null or (slot >= 1 and slot <= 6));

create unique index if not exists receipt_location_member_slot_uq
  on public.receipt_location (members_id, slot)
  where slot is not null;

create index if not exists idx_receipt_location_member
  on public.receipt_location (members_id);

create index if not exists idx_receipt_location_member_created
  on public.receipt_location (members_id, created_at);

alter table public.receipt_location enable row level security;

create policy receipt_location_self_all
  on public.receipt_location
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

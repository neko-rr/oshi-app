-- カテゴリータグ: プリセット slot 1..6・表示順（収納場所タグと同型）

-- 1) 列追加
alter table public.category_tag
  add column if not exists slot integer;

alter table public.category_tag
  add column if not exists display_order integer not null default 0;

-- 2) slot 範囲チェック
alter table public.category_tag
  drop constraint if exists category_tag_slot_range;

alter table public.category_tag
  add constraint category_tag_slot_range
  check (slot is null or (slot >= 1 and slot <= 6));

-- 3) プリセット slot はユーザー内で一意
drop index if exists public.category_tag_member_slot_uq;

create unique index if not exists category_tag_member_slot_uq
  on public.category_tag (members_id, slot)
  where slot is not null;

-- 4) 表示順用インデックス
create index if not exists idx_category_tag_member_display
  on public.category_tag (members_id, display_order);

-- 5) 既存行の display_order を埋める（slot 優先、その後 category_tag_id）
with ordered as (
  select
    category_tag_id,
    row_number() over (
      partition by members_id
      order by (slot is null), slot nulls last, category_tag_id
    ) as rn
  from public.category_tag
)
update public.category_tag ct
set display_order = o.rn * 10
from ordered o
where ct.category_tag_id = o.category_tag_id;

comment on column public.category_tag.slot is
  '1..6 はプリセット用。追加行は NULL。';
comment on column public.category_tag.display_order is
  '一覧の並び（昇順）。';

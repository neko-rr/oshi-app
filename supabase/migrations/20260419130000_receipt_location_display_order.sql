-- 収納場所の表示順（並び替え用）
alter table public.receipt_location
  add column if not exists display_order integer not null default 0;

-- 既存行: プリセット(slot あり)を先に slot 順、続けて追加行を id 順
with ordered as (
  select
    receipt_location_id,
    row_number() over (
      partition by members_id
      order by (slot is null), slot nulls last, receipt_location_id
    ) as rn
  from public.receipt_location
)
update public.receipt_location rl
set display_order = o.rn * 10
from ordered o
where rl.receipt_location_id = o.receipt_location_id;

create index if not exists idx_receipt_location_member_display
  on public.receipt_location (members_id, display_order);

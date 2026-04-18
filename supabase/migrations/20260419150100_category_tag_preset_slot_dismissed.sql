-- プリセットカテゴリ（slot 1..6）をユーザーが削除した slot は、ensure_default で再作成しない

create table if not exists public.category_tag_preset_slot_dismissed (
  members_id uuid not null references auth.users (id) on delete cascade,
  slot integer not null,
  dismissed_at timestamptz not null default now(),
  constraint category_tag_preset_slot_dismissed_slot_range
    check (slot >= 1 and slot <= 6),
  primary key (members_id, slot)
);

create index if not exists idx_category_tag_preset_slot_dismissed_member
  on public.category_tag_preset_slot_dismissed (members_id);

alter table public.category_tag_preset_slot_dismissed enable row level security;

drop policy if exists category_tag_preset_slot_dismissed_self_all
  on public.category_tag_preset_slot_dismissed;

create policy category_tag_preset_slot_dismissed_self_all
  on public.category_tag_preset_slot_dismissed
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

comment on table public.category_tag_preset_slot_dismissed is
  'slot 1..6 のプリセット行をユーザーが削除した記録。該当 slot は初期化で再 insert しない';

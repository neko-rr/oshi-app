-- color_tag をユーザーごと7スロットに固定し、HEX色を想定した制約を追加する

-- slot 列を追加（存在しない場合のみ）
alter table if exists public.color_tag
    add column if not exists slot int;

-- 既存データがある場合、members_id ごとに並べて 1..n を振る
do $$
begin
  if exists (select 1 from public.color_tag where slot is null) then
    update public.color_tag as ct
      set slot = sub.rn
    from (
      select color_tag_id, row_number() over (partition by members_id order by color_tag_id) as rn
      from public.color_tag
    ) sub
    where ct.color_tag_id = sub.color_tag_id
      and ct.slot is null;
  end if;
end $$;

-- slot を必須かつ 1..7 に制限
alter table if exists public.color_tag
  alter column slot set not null;

alter table if exists public.color_tag
  drop constraint if exists color_tag_slot_range;

alter table if exists public.color_tag
  add constraint color_tag_slot_range check (slot between 1 and 7);

-- members_id + slot を一意に
create unique index if not exists color_tag_member_slot_uq
  on public.color_tag(members_id, slot);

-- 色を HEX (#RRGGBB) 想定にする（任意だが制約を入れておく）
alter table if exists public.color_tag
  drop constraint if exists color_tag_color_hex_check;

alter table if exists public.color_tag
  add constraint color_tag_color_hex_check check (color_tag_color ~ '^#[0-9A-Fa-f]{6}$');

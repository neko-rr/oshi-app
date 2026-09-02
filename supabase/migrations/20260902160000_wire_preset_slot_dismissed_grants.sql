-- preset_slot_dismissed を API（authenticated + RLS）から操作可能にする
grant select, insert, delete on table public.category_tag_preset_slot_dismissed to authenticated;
grant select, insert, delete on table public.storage_location_preset_slot_dismissed to authenticated;

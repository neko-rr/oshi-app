-- カテゴリ設定で使う icon_tag の補足（キーホルダー・家庭用など）

insert into public.icon_tag (icon, icon_name, category_tag_use_flag, receipt_location_use_flag)
values
  ('bi-key', 'キーホルダー', 1, 0),
  ('bi-house-door', '家庭用（家）', 1, 0)
on conflict (icon) do nothing;

-- 仕事用: 収納場所でも使うがカテゴリ側のピッカーにも出す
update public.icon_tag
set category_tag_use_flag = 1
where icon = 'bi-briefcase';

-- theme_settings をアプリ連携（authenticated GRANT + 緑系 default）
-- RLS ポリシー theme_settings_self_all は既存のまま

alter table public.theme_settings
  alter column theme set default 'default';

-- 既存行のレガシー既定を揃える（任意の minty → default）
update public.theme_settings
set theme = 'default'
where theme = 'minty';

grant select, insert, update, delete on table public.theme_settings to authenticated;

revoke all on table public.theme_settings from anon;

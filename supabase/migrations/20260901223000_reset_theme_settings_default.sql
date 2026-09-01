-- 仮ユーザーの Dash/Bootswatch テーマ名を廃止。緑系 default（todo-app :root）へ統一
update public.theme_settings
set theme = 'default',
    updated_at = now()
where theme is distinct from 'default';

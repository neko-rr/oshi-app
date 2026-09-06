-- jwt_is_permanent_user の search_path 固定（advisor WARN 回避）
create or replace function public.jwt_is_permanent_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

comment on function public.jwt_is_permanent_user() is
  'JWT が本登録ユーザーか（is_anonymous でない）。RLS RESTRICTIVE 用';

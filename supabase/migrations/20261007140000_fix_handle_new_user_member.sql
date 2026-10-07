-- handle_new_user: 旧表名 member_information → member へ修正（Anonymous 作成失敗の原因）
-- セキュリティ:
--   - SECURITY DEFINER + search_path 固定（search_path ハイジャック防止）
--   - クライアント（anon / authenticated / public）から EXECUTE 不可（トリガー経由のみ）
--   - ゲスト（is_anonymous）は member 行を作らない（プロフィール肥大化・誤紐づけ防止）
--   - 本登録化（UPDATE で is_anonymous=false）時に member を upsert

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  -- ゲスト開始では業務プロフィールを作らない
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  insert into public.member (members_id, email_address)
  values (new.id, new.email)
  on conflict (members_id) do update
    set email_address = excluded.email_address
    where public.member.email_address is distinct from excluded.email_address;

  return new;
end;
$function$;

comment on function public.handle_new_user() is
  'auth.users INSERT 後に本登録ユーザーだけ public.member を upsert。ゲストはスキップ。クライアントから呼べない。';

-- ゲスト → 本登録（同一 uid で is_anonymous が false になる）で member を作る
create or replace function public.handle_user_became_permanent()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  -- ゲストのままなら何もしない
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  -- すでに本登録だった行のメール更新もここで揃える
  if coalesce(old.is_anonymous, false) = false
     and new.email is not distinct from old.email then
    return new;
  end if;

  insert into public.member (members_id, email_address)
  values (new.id, new.email)
  on conflict (members_id) do update
    set email_address = excluded.email_address
    where public.member.email_address is distinct from excluded.email_address;

  return new;
end;
$function$;

comment on function public.handle_user_became_permanent() is
  'auth.users UPDATE で本登録化／メール確定時に public.member を upsert。クライアントから呼べない。';

drop trigger if exists on_auth_user_became_permanent on auth.users;
create trigger on_auth_user_became_permanent
  after update of email, is_anonymous on auth.users
  for each row
  execute function public.handle_user_became_permanent();

-- トリガー専用: クライアント RPC 経路を塞ぐ
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_became_permanent() from public, anon, authenticated;

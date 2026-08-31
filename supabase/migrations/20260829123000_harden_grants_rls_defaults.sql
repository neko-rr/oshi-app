-- harden_grants_rls_defaults + revoke_handle_new_user_execute
-- 適用済み（Supabase）。意図: docs/db/security.md
-- 公式: https://supabase.com/docs/guides/api/securing-your-api

-- anon / public から全 public 表の権限を剥奪
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('revoke all on table public.%I from anon', r.tablename);
    execute format('revoke all on table public.%I from public', r.tablename);
  end loop;
end $$;

-- schema_ready: authenticated も不可
revoke all on table public.works_series from authenticated;
revoke all on table public.work from authenticated;
revoke all on table public.copyright_company from authenticated;
revoke all on table public.product_type from authenticated;
revoke all on table public.product_size from authenticated;
revoke all on table public.color from authenticated;
revoke all on table public.character from authenticated;
revoke all on table public.member_type from authenticated;
revoke all on table public.currency_unit from authenticated;
revoke all on table public.icon_tag from authenticated;
revoke all on table public.member from authenticated;
revoke all on table public.theme_settings from authenticated;
revoke all on table public.category_tag_preset_slot_dismissed from authenticated;
revoke all on table public.storage_location_preset_slot_dismissed from authenticated;

-- 緩いポリシー削除（省略可: ライブでは適用済み）

-- wired: authenticated に CRUD のみ
grant select, insert, update, delete on table public.photo to authenticated;
grant select, insert, update, delete on table public.registered_product to authenticated;
grant select, insert, update, delete on table public.registered_product_color_tag to authenticated;
grant select, insert, update, delete on table public.color_tag to authenticated;
grant select, insert, update, delete on table public.category_tag to authenticated;
grant select, insert, update, delete on table public.storage_location to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, public;

revoke execute on function public.handle_new_user() from anon, authenticated, public;

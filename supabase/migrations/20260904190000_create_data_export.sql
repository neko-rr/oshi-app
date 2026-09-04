-- データ書き出しジョブ（テキスト／写真付き ZIP）。成果物は Storage exports バケット。

create table public.data_export (
  data_export_id uuid primary key default gen_random_uuid(),
  members_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  status text not null default 'pending',
  storage_path text null,
  error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint data_export_kind_check
    check (kind = any (array['text'::text, 'media'::text])),
  constraint data_export_status_check
    check (
      status = any (
        array[
          'pending'::text,
          'running'::text,
          'ready'::text,
          'failed'::text
        ]
      )
    )
);

comment on table public.data_export is
  'ユーザー別データ書き出しジョブ（再取り込みなし。成果物は TTL 付き）';
comment on column public.data_export.kind is
  'text=JSON+CSV、media=写真同梱 ZIP';
comment on column public.data_export.status is
  'pending / running / ready / failed';
comment on column public.data_export.storage_path is
  'exports バケット内のオブジェクト path';
comment on column public.data_export.error_code is
  '失敗時の短いコード（ユーザー向けメッセージは API 側）';
comment on column public.data_export.expires_at is
  '成果物の失効時刻（以降は 410）';

alter table public.data_export enable row level security;

create policy data_export_self_all
  on public.data_export
  for all
  to authenticated
  using ( (select auth.uid()) = members_id )
  with check ( (select auth.uid()) = members_id );

create index data_export_members_id_idx
  on public.data_export (members_id);

create index data_export_members_status_idx
  on public.data_export (members_id, status)
  where status in ('pending', 'running');

grant select, insert, update, delete on table public.data_export to authenticated;
grant all on table public.data_export to service_role;
revoke all on table public.data_export from anon;

-- Private 一時成果物バケット（path: {members_id}/{data_export_id}.zip）
insert into storage.buckets (id, name, public, file_size_limit)
values ('exports', 'exports', false, 524288000)
on conflict (id) do nothing;

create policy exports_objects_self_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy exports_objects_self_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy exports_objects_self_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy exports_objects_self_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

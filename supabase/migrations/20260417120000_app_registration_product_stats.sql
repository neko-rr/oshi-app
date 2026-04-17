-- ホーム等で全行 select を避けるための集約（RLS: auth.uid() と members_id が一致する行のみ）
create or replace function public.app_registration_product_stats()
returns table(total bigint, total_photos bigint, unique_barcodes bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint as total,
    count(*) filter (where photo_id is not null)::bigint as total_photos,
    count(distinct nullif(btrim(barcode_number::text), ''))::bigint as unique_barcodes
  from public.registration_product_information
  where members_id = auth.uid();
$$;

grant execute on function public.app_registration_product_stats() to authenticated;

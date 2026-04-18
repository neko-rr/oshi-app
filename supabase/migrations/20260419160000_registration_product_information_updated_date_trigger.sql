-- registration_product_information は updated_date 列のみを持つが、
-- update_updated_at_column() は NEW.updated_at を参照するため BEFORE UPDATE で 42703 となり REST PATCH が失敗していた。

drop trigger if exists update_rpi_updated_at on public.registration_product_information;
drop trigger if exists update_registration_product_information_updated_at
  on public.registration_product_information;

create or replace function public.registration_product_information_set_updated_date()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_date := now();
  return new;
end;
$$;

comment on function public.registration_product_information_set_updated_date() is
  'registration_product_information.updated_date を更新（updated_at 列が無いため専用トリガー）';

create trigger registration_product_information_set_updated_date
  before update on public.registration_product_information
  for each row
  execute function public.registration_product_information_set_updated_date();

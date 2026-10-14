-- グッズの色（複数可）。カラータグとは別。多色コードは持たない。

alter table public.registered_product
  add column product_color_codes text[] not null default '{}';

alter table public.registered_product
  add constraint registered_product_product_color_codes_check
  check (
    product_color_codes <@ array[
      'white', 'black', 'gray', 'red', 'pink', 'orange', 'yellow',
      'green', 'blue', 'light_blue', 'purple', 'brown', 'beige', 'gold', 'silver'
    ]::text[]
  );

create index registered_product_product_color_codes_idx
  on public.registered_product using gin (product_color_codes);

comment on column public.registered_product.product_color_codes is
  'グッズの色コード（複数可）。カラータグとは別';

alter table public.gallery_view
  add column product_color_codes text[] not null default '{}';

alter table public.gallery_view
  add constraint gallery_view_product_color_codes_check
  check (
    product_color_codes <@ array[
      'white', 'black', 'gray', 'red', 'pink', 'orange', 'yellow',
      'green', 'blue', 'light_blue', 'purple', 'brown', 'beige', 'gold', 'silver'
    ]::text[]
  );

comment on column public.gallery_view.product_color_codes is
  '保存した絞り込みのグッズの色（同種 OR）';

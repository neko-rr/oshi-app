-- 保存ビューに、価格なし・購入日なし・購入月の絞り込みを持つ。

alter table public.gallery_view
  add column missing_price boolean not null default false,
  add column missing_purchase_date boolean not null default false,
  add column purchase_month text;

alter table public.gallery_view
  add constraint gallery_view_purchase_month_check
  check (
    purchase_month is null
    or purchase_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  );

comment on column public.gallery_view.missing_price is
  '購入価格が空のグッズだけ';
comment on column public.gallery_view.missing_purchase_date is
  '購入日が空のグッズだけ';
comment on column public.gallery_view.purchase_month is
  '購入日の暦月 YYYY-MM。空なら月では絞らない';

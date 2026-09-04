-- registered_product: 購入価格の記録通貨（ISO 4217。換算なし）
alter table public.registered_product
  add column if not exists currency_code text null;

comment on column public.registered_product.currency_code is
  '購入価格の記録通貨（ISO 4217。null 可。検証は API）';

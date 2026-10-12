-- 保存ビューに交換OK・欲しいの絞り込みを載せる（JSON 黒箱は使わない）。

alter table public.gallery_view
  add column sales_desired boolean not null default false,
  add column want_object boolean not null default false;

comment on column public.gallery_view.sales_desired is
  '交換OK（sales_desired_flag=1）だけに絞る。false は絞らない';
comment on column public.gallery_view.want_object is
  '欲しい（want_object_flag=1）だけに絞る。false は絞らない';

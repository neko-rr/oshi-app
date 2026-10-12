-- 保存ビューに、カテゴリなし・収納なし・写真なし・同じバーコードの絞り込みを持つ。

alter table public.gallery_view
  add column missing_category boolean not null default false,
  add column missing_storage boolean not null default false,
  add column missing_photo boolean not null default false,
  add column duplicate_barcode boolean not null default false;

comment on column public.gallery_view.missing_category is
  'カテゴリが空のグッズだけ';
comment on column public.gallery_view.missing_storage is
  '収納場所が空のグッズだけ';
comment on column public.gallery_view.missing_photo is
  '写真が無いグッズだけ';
comment on column public.gallery_view.duplicate_barcode is
  '同じバーコードが2件以上あるグッズだけ';

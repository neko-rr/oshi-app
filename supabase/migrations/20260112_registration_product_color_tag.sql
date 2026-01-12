-- 多対多: registration_product_information と color_tag を slot で紐づける
-- 各ユーザー7色の slot (1..7) を利用し、複数カラータグ付与とフィルタを可能にする

create table if not exists public.registration_product_color_tag (
  members_id uuid not null references auth.users(id) on delete cascade,
  registration_product_id integer not null references public.registration_product_information(registration_product_id) on delete cascade,
  slot int not null,
  constraint registration_product_color_tag_slot_range check (slot between 1 and 7),
  constraint registration_product_color_tag_member_slot_fk
    foreign key (members_id, slot) references public.color_tag(members_id, slot) on delete cascade,
  constraint registration_product_color_tag_pk primary key (members_id, registration_product_id, slot)
);

-- index for filtering by color slot
create index if not exists idx_rpct_member_slot on public.registration_product_color_tag(members_id, slot);
-- index for fetching tags for products
create index if not exists idx_rpct_member_product on public.registration_product_color_tag(members_id, registration_product_id);

-- RLS: ユーザー自身のみ
alter table public.registration_product_color_tag enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='registration_product_color_tag' and policyname='rpct_select') then
    create policy rpct_select on public.registration_product_color_tag
      for select using (auth.uid() = members_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='registration_product_color_tag' and policyname='rpct_insert') then
    create policy rpct_insert on public.registration_product_color_tag
      for insert with check (auth.uid() = members_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='registration_product_color_tag' and policyname='rpct_update') then
    create policy rpct_update on public.registration_product_color_tag
      for update using (auth.uid() = members_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='registration_product_color_tag' and policyname='rpct_delete') then
    create policy rpct_delete on public.registration_product_color_tag
      for delete using (auth.uid() = members_id);
  end if;
end $$;

create table if not exists shop_offers (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete cascade,
  title          text not null,
  description    text,
  discount_type  text check (discount_type in ('percent', 'flat')),
  discount_value numeric(10,2),
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_shop_offers_shop_id on shop_offers(shop_id);

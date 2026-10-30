create extension if not exists pgcrypto;

create table if not exists public.menu_categories (
  id text primary key,
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.menu_items (
  id text primary key,
  category_id text not null references public.menu_categories(id),
  name text not null,
  description text not null default '',
  price_kobo bigint not null check (price_kobo >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_item_options (
  id text not null,
  menu_item_id text not null references public.menu_items(id) on delete cascade,
  label text not null,
  price_kobo bigint not null check (price_kobo >= 0),
  is_available boolean not null default true,
  primary key (menu_item_id, id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  lookup_token_hash text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_note text,
  status text not null default 'received' check (status in ('received','confirmed','preparing','ready','completed','cancelled')),
  subtotal_kobo bigint not null check (subtotal_kobo >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id text not null,
  item_name text not null,
  quantity integer not null check (quantity between 1 and 20),
  base_price_kobo bigint not null check (base_price_kobo >= 0),
  line_total_kobo bigint not null check (line_total_kobo >= 0)
);

create table if not exists public.order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  option_id text not null,
  option_label text not null,
  price_kobo bigint not null check (price_kobo >= 0)
);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_options enable row level security;
alter table public.order_events enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_options enable row level security;

drop policy if exists "Public can read active menu categories" on public.menu_categories;
create policy "Public can read active menu categories" on public.menu_categories for select using (is_active);
drop policy if exists "Public can read available menu items" on public.menu_items;
create policy "Public can read available menu items" on public.menu_items for select using (is_available);
drop policy if exists "Public can read available menu options" on public.menu_item_options;
create policy "Public can read available menu options" on public.menu_item_options for select using (is_available);

insert into public.menu_categories (id,name,sort_order) values
('swallows','Swallows',1),('rice-grains','Rice & Grains',2),('soups-stews','Soups & Stews',3),
('grills-protein','Grills & Protein',4),('sides-small-chops','Sides & Small Chops',5),('drinks-treats','Drinks & Treats',6)
on conflict (id) do update set name=excluded.name, sort_order=excluded.sort_order;

insert into public.menu_items (id,category_id,name,description,price_kobo) values
('amala-abula','swallows','Amala, Gbegiri & Ewedu','Amala with the classic Yoruba duo, pepper stew and assorted meat.',450000),
('amala-ewedu','swallows','Amala & Ewedu','Soft amala with silky ewedu and pepper stew.',350000),
('pounded-yam-egusi','swallows','Pounded Yam & Egusi','A hearty swallow pairing with rich egusi soup.',520000),
('eba-ogbono','swallows','Eba & Ogbono','Classic eba with draw-soup comfort.',420000),
('jollof','rice-grains','Smoky Jollof Rice','Nigerian-style jollof with a bold tomato-pepper base.',380000),
('fried-rice','rice-grains','Nigerian Fried Rice','Colourful fried rice with vegetables and seasoning.',400000),
('ofada','rice-grains','Ofada Rice & Ayamase','Local rice with signature green pepper sauce.',550000),
('beans','rice-grains','Beans Porridge','Slow-cooked beans with palm oil and pepper.',320000),
('egusi','soups-stews','Egusi Soup','Melon-seed soup with leafy greens and rich seasoning.',350000),
('ewedu','soups-stews','Ewedu','Silky jute-leaf soup, a Yoruba favourite.',180000),
('efo-riro','soups-stews','Efo Riro','A rich vegetable stew with peppers and assorted ingredients.',350000),
('asun','grills-protein','Peppered Asun','Goat meat tossed with pepper, onions and spice.',650000),
('suya','grills-protein','Beef Suya','Spiced grilled beef with onions and fresh pepper.',550000),
('pepper-soup','grills-protein','Assorted Meat Pepper Soup','A warming peppery broth with assorted cuts.',600000),
('dodo','sides-small-chops','Dodo (Fried Plantain)','Sweet ripe plantain, fried golden.',180000),
('moi-moi','sides-small-chops','Moi Moi','Steamed bean pudding, soft and savoury.',150000),
('zobo','drinks-treats','Chilled Zobo','A refreshing hibiscus drink, served chilled.',120000),
('chapman','drinks-treats','Chapman','A bright, fruity Nigerian-style mocktail.',180000)
on conflict (id) do update set category_id=excluded.category_id,name=excluded.name,description=excluded.description,price_kobo=excluded.price_kobo;

insert into public.menu_item_options (menu_item_id,id,label,price_kobo) values
('amala-abula','beef','Extra beef',120000),('amala-abula','ponmo','Extra ponmo',80000),('amala-abula','assorted','Extra assorted meat',180000),
('amala-ewedu','beef','Extra beef',120000),('amala-ewedu','ponmo','Extra ponmo',80000),
('pounded-yam-egusi','goat','Goat meat',180000),('pounded-yam-egusi','fish','Stockfish',150000),('pounded-yam-egusi','ponmo','Extra ponmo',80000),
('eba-ogbono','beef','Extra beef',120000),('eba-ogbono','fish','Stockfish',150000),
('jollof','chicken','Grilled chicken',220000),('jollof','beef','Beef',150000),('jollof','plantain','Add dodo',100000),
('fried-rice','chicken','Grilled chicken',220000),('fried-rice','beef','Beef',150000),('fried-rice','plantain','Add dodo',100000),
('ofada','assorted','Assorted meat',180000),('ofada','egg','Boiled egg',80000),
('beans','plantain','Add dodo',100000),('beans','fish','Add fish',150000),
('egusi','beef','Beef',120000),('egusi','goat','Goat meat',180000),('egusi','fish','Stockfish',150000),
('ewedu','gbegiri','Add gbegiri',100000),('ewedu','stew','Add pepper stew',100000),
('efo-riro','beef','Beef',120000),('efo-riro','fish','Stockfish',150000),
('asun','large','Large portion',250000),('suya','large','Large portion',200000),
('pepper-soup','goat','Add goat meat',180000),('dodo','large','Large portion',100000),
('moi-moi','egg','With egg',50000),('zobo','large','Large bottle',80000),('chapman','large','Large glass',70000)
on conflict (menu_item_id,id) do update set label=excluded.label,price_kobo=excluded.price_kobo;

create or replace function public.create_customer_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  customer jsonb := payload->'customer';
  line jsonb;
  opt_id text;
  item_row public.menu_items%rowtype;
  option_row public.menu_item_options%rowtype;
  order_uuid uuid;
  order_ref text;
  raw_token text;
  qty integer;
  base_total bigint := 0;
  option_total bigint;
  line_total bigint;
  order_item_uuid uuid;
  selected_options jsonb;
  option_snapshot jsonb;
  item_snapshot jsonb := '[]'::jsonb;
begin
  if customer is null or jsonb_typeof(payload->'items') <> 'array' then
    raise exception 'Invalid order payload' using errcode = '22023';
  end if;
  if length(trim(coalesce(customer->>'name',''))) < 2 or length(trim(coalesce(customer->>'phone',''))) < 7 then
    raise exception 'Customer details are incomplete' using errcode = '22023';
  end if;
  if jsonb_array_length(payload->'items') < 1 or jsonb_array_length(payload->'items') > 40 then
    raise exception 'Invalid order item count' using errcode = '22023';
  end if;

  order_uuid := gen_random_uuid();
  order_ref := 'AS-' || upper(substr(replace(order_uuid::text,'-',''),1,10));
  raw_token := encode(gen_random_bytes(32),'hex');

  insert into public.orders(id,reference,lookup_token_hash,customer_name,customer_phone,customer_email,customer_note,subtotal_kobo)
  values(order_uuid,order_ref,encode(digest(raw_token,'sha256'),'hex'),
    trim(customer->>'name'),trim(customer->>'phone'),nullif(trim(coalesce(customer->>'email','')),''),
    nullif(trim(coalesce(customer->>'note','')),'') ,0);

  for line in select value from jsonb_array_elements(payload->'items') loop
    select * into item_row from public.menu_items where id=line->>'itemId' and is_available=true;
    if not found then raise exception 'A selected item is unavailable' using errcode = '22023'; end if;
    qty := (line->>'quantity')::integer;
    if qty < 1 or qty > 20 then raise exception 'Invalid quantity' using errcode = '22023'; end if;
    selected_options := coalesce(line->'options','[]'::jsonb);
    if jsonb_typeof(selected_options) <> 'array' or jsonb_array_length(selected_options) > 10 then
      raise exception 'Invalid item options' using errcode = '22023';
    end if;
    if (select count(distinct value) from jsonb_array_elements_text(selected_options)) <> jsonb_array_length(selected_options) then
      raise exception 'Duplicate item options' using errcode = '22023';
    end if;

    option_total := 0;
    option_snapshot := '[]'::jsonb;
    for opt_id in select value from jsonb_array_elements_text(selected_options) loop
      select * into option_row from public.menu_item_options
        where menu_item_id=item_row.id and id=opt_id and is_available=true;
      if not found then raise exception 'An item extra is invalid or unavailable' using errcode = '22023'; end if;
      option_total := option_total + option_row.price_kobo;
      option_snapshot := option_snapshot || jsonb_build_array(jsonb_build_object('id',option_row.id,'label',option_row.label,'priceKobo',option_row.price_kobo));
    end loop;

    line_total := (item_row.price_kobo + option_total) * qty;
    base_total := base_total + line_total;
    insert into public.order_items(order_id,menu_item_id,item_name,quantity,base_price_kobo,line_total_kobo)
    values(order_uuid,item_row.id,item_row.name,qty,item_row.price_kobo,line_total)
    returning id into order_item_uuid;

    for opt_id in select value from jsonb_array_elements_text(selected_options) loop
      select * into option_row from public.menu_item_options where menu_item_id=item_row.id and id=opt_id;
      insert into public.order_item_options(order_item_id,option_id,option_label,price_kobo)
      values(order_item_uuid,option_row.id,option_row.label,option_row.price_kobo);
    end loop;

    item_snapshot := item_snapshot || jsonb_build_array(jsonb_build_object(
      'itemId',item_row.id,'name',item_row.name,'quantity',qty,
      'basePriceKobo',item_row.price_kobo,'lineTotalKobo',line_total,'options',option_snapshot
    ));
  end loop;

  update public.orders set subtotal_kobo=base_total where id=order_uuid;
  insert into public.order_events(order_id,status,note) values(order_uuid,'received','Order created through the independent demo storefront.');
  return jsonb_build_object('reference',order_ref,'lookupToken',raw_token,'totalKobo',base_total,
    'customerName',trim(customer->>'name'),'items',item_snapshot,
    'message','Order saved to this independent concept database. It has not been sent to a real restaurant or paid for.');
end;
$$;

revoke all on function public.create_customer_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_customer_order(jsonb) to service_role;

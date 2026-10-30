-- Query-path indexes and database-level invariants for production order data.
-- Safe to apply after migrations 0001–0003.

create index if not exists order_events_order_created_idx
  on public.order_events(order_id, created_at asc);

create index if not exists order_item_options_order_item_idx
  on public.order_item_options(order_item_id);

create index if not exists menu_item_options_item_available_idx
  on public.menu_item_options(menu_item_id, is_available);

create index if not exists menu_items_category_available_idx
  on public.menu_items(category_id, is_available);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_customer_name_length_check'
  ) then
    alter table public.orders
      add constraint orders_customer_name_length_check
      check (char_length(btrim(customer_name)) between 2 and 100) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_customer_phone_length_check'
  ) then
    alter table public.orders
      add constraint orders_customer_phone_length_check
      check (char_length(btrim(customer_phone)) between 7 and 24) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_customer_email_length_check'
  ) then
    alter table public.orders
      add constraint orders_customer_email_length_check
      check (customer_email is null or char_length(customer_email) <= 254) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_customer_note_length_check'
  ) then
    alter table public.orders
      add constraint orders_customer_note_length_check
      check (customer_note is null or char_length(customer_note) <= 500) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_lookup_token_hash_format_check'
  ) then
    alter table public.orders
      add constraint orders_lookup_token_hash_format_check
      check (lookup_token_hash ~ '^[a-f0-9]{64}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_events'::regclass
      and conname = 'order_events_status_check'
  ) then
    alter table public.order_events
      add constraint order_events_status_check
      check (status in ('received','confirmed','preparing','ready','completed','cancelled')) not valid;
  end if;
end;
$$;

alter table public.orders validate constraint orders_customer_name_length_check;
alter table public.orders validate constraint orders_customer_phone_length_check;
alter table public.orders validate constraint orders_customer_email_length_check;
alter table public.orders validate constraint orders_customer_note_length_check;
alter table public.orders validate constraint orders_lookup_token_hash_format_check;
alter table public.order_events validate constraint order_events_status_check;

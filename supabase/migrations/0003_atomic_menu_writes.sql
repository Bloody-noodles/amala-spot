-- Atomic menu writes: a dish and its extras are committed or rolled back together.
create or replace function public.create_admin_menu_item(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id text := trim(coalesce(p_payload->>'id',''));
  v_category_id text := trim(coalesce(p_payload->>'category_id',''));
  v_name text := trim(coalesce(p_payload->>'name',''));
  v_description text := trim(coalesce(p_payload->>'description',''));
  v_price bigint;
  v_option jsonb;
  v_option_id text;
  v_label text;
  v_option_price bigint;
  v_item public.menu_items%rowtype;
  v_options jsonb := coalesce(p_payload->'options','[]'::jsonb);
begin
  if v_id !~ '^[a-z0-9-]{2,60}$' or length(v_name) not between 2 and 100
     or length(v_description) > 500
     or coalesce(p_payload->>'price_kobo','') !~ '^[0-9]{1,12}$'
     or jsonb_typeof(v_options) <> 'array' or jsonb_array_length(v_options) > 20 then
    raise exception 'Invalid menu item payload' using errcode = '22023';
  end if;
  v_price := (p_payload->>'price_kobo')::bigint;
  if not exists (select 1 from menu_categories where id=v_category_id and is_active=true) then
    raise exception 'Menu category is unavailable' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_options) a
    where coalesce(a->>'id','') !~ '^[a-z0-9-]{1,50}$'
       or length(trim(coalesce(a->>'label',''))) not between 1 and 80
       or coalesce(a->>'price_kobo','') !~ '^[0-9]{1,12}$'
  ) or (select count(*) from jsonb_array_elements(v_options))
       <> (select count(distinct value->>'id') from jsonb_array_elements(v_options) value) then
    raise exception 'Invalid or duplicate menu extras' using errcode = '22023';
  end if;

  insert into menu_items(id,category_id,name,description,price_kobo,is_available,updated_at)
  values(v_id,v_category_id,v_name,v_description,v_price,coalesce((p_payload->>'is_available')::boolean,true),now())
  returning * into v_item;

  for v_option in select value from jsonb_array_elements(v_options) loop
    insert into menu_item_options(id,menu_item_id,label,price_kobo,is_available)
    values(v_option->>'id',v_id,trim(v_option->>'label'),(v_option->>'price_kobo')::bigint,
           coalesce((v_option->>'is_available')::boolean,true));
  end loop;

  return jsonb_build_object('item',jsonb_build_object(
    'id',v_item.id,'category_id',v_item.category_id,'name',v_item.name,
    'description',v_item.description,'price_kobo',v_item.price_kobo,
    'is_available',v_item.is_available
  ));
end;
$$;

create or replace function public.update_admin_menu_item(p_item_id text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_category_id text := trim(coalesce(p_payload->>'category_id',''));
  v_name text := trim(coalesce(p_payload->>'name',''));
  v_description text := trim(coalesce(p_payload->>'description',''));
  v_price bigint;
  v_option jsonb;
  v_options jsonb := coalesce(p_payload->'options','[]'::jsonb);
  v_item public.menu_items%rowtype;
begin
  if p_item_id is null or length(p_item_id) not between 2 and 60
     or length(v_name) not between 2 and 100 or length(v_description) > 500
     or coalesce(p_payload->>'price_kobo','') !~ '^[0-9]{1,12}$'
     or jsonb_typeof(v_options) <> 'array' or jsonb_array_length(v_options) > 20 then
    raise exception 'Invalid menu item payload' using errcode = '22023';
  end if;
  v_price := (p_payload->>'price_kobo')::bigint;
  if not exists (select 1 from menu_categories where id=v_category_id and is_active=true) then
    raise exception 'Menu category is unavailable' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_options) a
    where coalesce(a->>'id','') !~ '^[a-z0-9-]{1,50}$'
       or length(trim(coalesce(a->>'label',''))) not between 1 and 80
       or coalesce(a->>'price_kobo','') !~ '^[0-9]{1,12}$'
  ) or (select count(*) from jsonb_array_elements(v_options))
       <> (select count(distinct value->>'id') from jsonb_array_elements(v_options) value) then
    raise exception 'Invalid or duplicate menu extras' using errcode = '22023';
  end if;

  update menu_items set category_id=v_category_id,name=v_name,description=v_description,
    price_kobo=v_price,is_available=coalesce((p_payload->>'is_available')::boolean,true),
    updated_at=now()
  where id=p_item_id returning * into v_item;
  if not found then raise exception 'Menu item not found' using errcode = 'P0002'; end if;

  delete from menu_item_options where menu_item_id=p_item_id;
  for v_option in select value from jsonb_array_elements(v_options) loop
    insert into menu_item_options(id,menu_item_id,label,price_kobo,is_available)
    values(v_option->>'id',p_item_id,trim(v_option->>'label'),(v_option->>'price_kobo')::bigint,
           coalesce((v_option->>'is_available')::boolean,true));
  end loop;

  return jsonb_build_object('item',jsonb_build_object(
    'id',v_item.id,'category_id',v_item.category_id,'name',v_item.name,
    'description',v_item.description,'price_kobo',v_item.price_kobo,
    'is_available',v_item.is_available
  ));
end;
$$;

revoke all on function public.create_admin_menu_item(jsonb) from public, anon, authenticated;
revoke all on function public.update_admin_menu_item(text,jsonb) from public, anon, authenticated;
grant execute on function public.create_admin_menu_item(jsonb) to service_role;
grant execute on function public.update_admin_menu_item(text,jsonb) to service_role;

-- Make order status changes and their audit events one atomic database operation.
create or replace function public.transition_customer_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_status text;
  allowed_next text[];
  clean_note text;
begin
  if p_status not in ('received','confirmed','preparing','ready','completed','cancelled') then
    raise exception 'Invalid order status' using errcode = '22023';
  end if;

  select status into current_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  allowed_next := case current_status
    when 'received' then array['confirmed','cancelled']
    when 'confirmed' then array['preparing','cancelled']
    when 'preparing' then array['ready','cancelled']
    when 'ready' then array['completed']
    else array[]::text[]
  end;

  if not p_status = any(allowed_next) then
    raise exception 'Invalid order status transition' using errcode = '23514';
  end if;

  clean_note := nullif(left(trim(coalesce(p_note,'')),300),'');

  update public.orders set status = p_status where id = p_order_id;
  insert into public.order_events(order_id,status,note)
  values (p_order_id,p_status,coalesce(clean_note,'Status updated in the Amala Spot admin dashboard.'));

  return jsonb_build_object('status',p_status);
end;
$$;

revoke all on function public.transition_customer_order_status(uuid,text,text) from public, anon, authenticated;
grant execute on function public.transition_customer_order_status(uuid,text,text) to service_role;

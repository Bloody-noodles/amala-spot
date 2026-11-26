-- Correct the fallback catalogue typo without changing item IDs, prices, or options.
update public.menu_items
set name = 'Greek Yoghurt',
    description = 'Chilled, creamy Greek yoghurt.',
    updated_at = now()
where id = 'geek-yoghurt'
  and (name <> 'Greek Yoghurt' or description <> 'Chilled, creamy Greek yoghurt.');

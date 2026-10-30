-- Expand the independent Amala Spot demo catalogue with familiar Nigerian refreshments.
-- Prices are illustrative NGN amounts stored as integer kobo, not verified retail prices.
insert into public.menu_categories (id,name,sort_order,is_active)
values ('drinks-refreshments','Drinks & Refreshments',6,true)
on conflict (id) do update set name=excluded.name, sort_order=excluded.sort_order, is_active=true;

update public.menu_items
set category_id='drinks-refreshments'
where id in ('zobo','chapman');

insert into public.menu_items (id,category_id,name,description,price_kobo,is_available) values
('coca-cola','drinks-refreshments','Coca-Cola','Chilled Coca-Cola soft drink.',180000,true),
('fanta-orange','drinks-refreshments','Fanta Orange','Bright orange-flavoured sparkling soft drink, served chilled.',180000,true),
('sprite','drinks-refreshments','Sprite','Crisp lemon-lime sparkling soft drink.',180000,true),
('7up','drinks-refreshments','7UP','Refreshing lemon-lime carbonated soft drink.',180000,true),
('pepsi','drinks-refreshments','Pepsi','Chilled cola soft drink.',180000,true),
('maltina','drinks-refreshments','Maltina','Nourishing malt beverage, served chilled.',250000,true),
('malta-guinness','drinks-refreshments','Malta Guinness','Rich non-alcoholic malt drink.',250000,true),
('five-alive-pulpy','drinks-refreshments','Five Alive Pulpy','Citrus fruit drink with juicy pulp.',350000,true),
('five-alive-berry','drinks-refreshments','Five Alive Berry Blast','Fruity berry blend from Five Alive.',350000,true),
('chivita-active','drinks-refreshments','Chivita Active','Chilled fruit juice blend.',400000,true),
('chivita-100','drinks-refreshments','Chivita 100%','Fruit juice with a full-bodied fruit taste.',550000,true),
('geek-yoghurt','drinks-refreshments','Geek Yoghurt','Chilled, creamy drinking yoghurt.',450000,true),
('hollandia-yoghurt','drinks-refreshments','Hollandia Yoghurt','Smooth, chilled yoghurt drink.',500000,true),
('drinking-yoghurt','drinks-refreshments','Drinking Yoghurt','Creamy yoghurt drink; flavour depends on the selected option.',350000,true),
('almond-drink','drinks-refreshments','Almond Drink','Chilled almond-based beverage.',650000,true),
('tiger-nut-drink','drinks-refreshments','Tiger-Nut Milk','Chilled Nigerian-style tiger-nut drink.',450000,true),
('kunu','drinks-refreshments','Kunu','Traditional chilled grain-based Nigerian drink.',300000,true),
('bottled-water','drinks-refreshments','Bottled Water','Chilled bottled drinking water.',100000,true),
('coca-cola-can','drinks-refreshments','Coca-Cola Can','Chilled Coca-Cola in a can.',250000,true),
('fanta-can','drinks-refreshments','Fanta Orange Can','Chilled Fanta Orange in a can.',250000,true),
('sprite-can','drinks-refreshments','Sprite Can','Chilled Sprite in a can.',250000,true),
('7up-can','drinks-refreshments','7UP Can','Chilled 7UP in a can.',250000,true),
('pepsi-can','drinks-refreshments','Pepsi Can','Chilled Pepsi in a can.',250000,true)
on conflict (id) do update set category_id=excluded.category_id,name=excluded.name,description=excluded.description,price_kobo=excluded.price_kobo,is_available=excluded.is_available;

insert into public.menu_item_options (menu_item_id,id,label,price_kobo,is_available) values
('coca-cola','large','Large bottle',70000,true),('coca-cola','family','Family bottle',220000,true),
('fanta-orange','large','Large bottle',70000,true),('fanta-orange','family','Family bottle',220000,true),
('sprite','large','Large bottle',70000,true),('sprite','family','Family bottle',220000,true),
('7up','large','Large bottle',70000,true),('7up','family','Family bottle',220000,true),
('pepsi','large','Large bottle',70000,true),('pepsi','family','Family bottle',220000,true),
('maltina','large','Large bottle',100000,true),('malta-guinness','large','Large bottle',100000,true),
('five-alive-pulpy','large','Large pack',150000,true),('five-alive-pulpy','family','Family pack',350000,true),
('five-alive-berry','large','Large pack',150000,true),('five-alive-berry','family','Family pack',350000,true),
('chivita-active','large','Large pack',200000,true),('chivita-active','family','Family pack',450000,true),
('chivita-100','large','Large pack',250000,true),
('geek-yoghurt','large','Large bottle',200000,true),('hollandia-yoghurt','large','Large bottle',200000,true),
('drinking-yoghurt','strawberry','Strawberry flavour',50000,true),('drinking-yoghurt','vanilla','Vanilla flavour',50000,true),
('almond-drink','large','Large bottle',250000,true),('tiger-nut-drink','large','Large bottle',150000,true),
('kunu','large','Large bottle',100000,true),
('bottled-water','large','Large bottle',50000,true),
('coca-cola-can','pack-6','Pack of 6 cans',1100000,true),
('fanta-can','pack-6','Pack of 6 cans',1100000,true),
('sprite-can','pack-6','Pack of 6 cans',1100000,true),
('7up-can','pack-6','Pack of 6 cans',1100000,true),
('pepsi-can','pack-6','Pack of 6 cans',1100000,true)
on conflict (menu_item_id,id) do update set label=excluded.label,price_kobo=excluded.price_kobo,is_available=excluded.is_available;

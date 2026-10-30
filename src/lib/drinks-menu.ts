import type { MenuItem } from "@/lib/menu";

// Static fallback mirrors the Supabase drinks catalogue. Prices are illustrative NGN.
export const drinkMenuItems: MenuItem[] = [
  { id:"zobo", name:"Chilled Zobo", category:"Drinks & Refreshments", description:"A refreshing hibiscus drink, served chilled.", priceKobo:120000, options:[{id:"large",label:"Large bottle",priceKobo:80000}] },
  { id:"chapman", name:"Chapman", category:"Drinks & Refreshments", description:"A bright, fruity Nigerian-style mocktail.", priceKobo:180000, options:[{id:"large",label:"Large glass",priceKobo:70000}] },
  { id:"coca-cola", name:"Coca-Cola", category:"Drinks & Refreshments", description:"Chilled Coca-Cola soft drink.", priceKobo:180000, options:[{id:"large",label:"Large bottle",priceKobo:70000},{id:"family",label:"Family bottle",priceKobo:220000}] },
  { id:"fanta-orange", name:"Fanta Orange", category:"Drinks & Refreshments", description:"Bright orange-flavoured sparkling soft drink, served chilled.", priceKobo:180000, options:[{id:"large",label:"Large bottle",priceKobo:70000},{id:"family",label:"Family bottle",priceKobo:220000}] },
  { id:"sprite", name:"Sprite", category:"Drinks & Refreshments", description:"Crisp lemon-lime sparkling soft drink.", priceKobo:180000, options:[{id:"large",label:"Large bottle",priceKobo:70000},{id:"family",label:"Family bottle",priceKobo:220000}] },
  { id:"7up", name:"7UP", category:"Drinks & Refreshments", description:"Refreshing lemon-lime carbonated soft drink.", priceKobo:180000, options:[{id:"large",label:"Large bottle",priceKobo:70000},{id:"family",label:"Family bottle",priceKobo:220000}] },
  { id:"pepsi", name:"Pepsi", category:"Drinks & Refreshments", description:"Chilled cola soft drink.", priceKobo:180000, options:[{id:"large",label:"Large bottle",priceKobo:70000},{id:"family",label:"Family bottle",priceKobo:220000}] },
  { id:"maltina", name:"Maltina", category:"Drinks & Refreshments", description:"Nourishing malt beverage, served chilled.", priceKobo:250000, options:[{id:"large",label:"Large bottle",priceKobo:100000}] },
  { id:"malta-guinness", name:"Malta Guinness", category:"Drinks & Refreshments", description:"Rich non-alcoholic malt drink.", priceKobo:250000, options:[{id:"large",label:"Large bottle",priceKobo:100000}] },
  { id:"five-alive-pulpy", name:"Five Alive Pulpy", category:"Drinks & Refreshments", description:"Citrus fruit drink with juicy pulp.", priceKobo:350000, options:[{id:"large",label:"Large pack",priceKobo:150000},{id:"family",label:"Family pack",priceKobo:350000}] },
  { id:"five-alive-berry", name:"Five Alive Berry Blast", category:"Drinks & Refreshments", description:"Fruity berry blend from Five Alive.", priceKobo:350000, options:[{id:"large",label:"Large pack",priceKobo:150000},{id:"family",label:"Family pack",priceKobo:350000}] },
  { id:"chivita-active", name:"Chivita Active", category:"Drinks & Refreshments", description:"Chilled fruit juice blend.", priceKobo:400000, options:[{id:"large",label:"Large pack",priceKobo:200000},{id:"family",label:"Family pack",priceKobo:450000}] },
  { id:"chivita-100", name:"Chivita 100%", category:"Drinks & Refreshments", description:"Fruit juice with a full-bodied fruit taste.", priceKobo:550000, options:[{id:"large",label:"Large pack",priceKobo:250000}] },
  { id:"geek-yoghurt", name:"Geek Yoghurt", category:"Drinks & Refreshments", description:"Chilled, creamy drinking yoghurt.", priceKobo:450000, options:[{id:"large",label:"Large bottle",priceKobo:200000}] },
  { id:"hollandia-yoghurt", name:"Hollandia Yoghurt", category:"Drinks & Refreshments", description:"Smooth, chilled yoghurt drink.", priceKobo:500000, options:[{id:"large",label:"Large bottle",priceKobo:200000}] },
  { id:"drinking-yoghurt", name:"Drinking Yoghurt", category:"Drinks & Refreshments", description:"Creamy yoghurt drink; flavour depends on the selected option.", priceKobo:350000, options:[{id:"strawberry",label:"Strawberry flavour",priceKobo:50000},{id:"vanilla",label:"Vanilla flavour",priceKobo:50000}] },
  { id:"almond-drink", name:"Almond Drink", category:"Drinks & Refreshments", description:"Chilled almond-based beverage.", priceKobo:650000, options:[{id:"large",label:"Large bottle",priceKobo:250000}] },
  { id:"tiger-nut-drink", name:"Tiger-Nut Milk", category:"Drinks & Refreshments", description:"Chilled Nigerian-style tiger-nut drink.", priceKobo:450000, options:[{id:"large",label:"Large bottle",priceKobo:150000}] },
  { id:"kunu", name:"Kunu", category:"Drinks & Refreshments", description:"Traditional chilled grain-based Nigerian drink.", priceKobo:300000, options:[{id:"large",label:"Large bottle",priceKobo:100000}] },
  { id:"bottled-water", name:"Bottled Water", category:"Drinks & Refreshments", description:"Chilled bottled drinking water.", priceKobo:100000, options:[{id:"large",label:"Large bottle",priceKobo:50000}] },
  { id:"coca-cola-can", name:"Coca-Cola Can", category:"Drinks & Refreshments", description:"Chilled Coca-Cola in a can.", priceKobo:250000, options:[{id:"pack-6",label:"Pack of 6 cans",priceKobo:1100000}] },
  { id:"fanta-can", name:"Fanta Orange Can", category:"Drinks & Refreshments", description:"Chilled Fanta Orange in a can.", priceKobo:250000, options:[{id:"pack-6",label:"Pack of 6 cans",priceKobo:1100000}] },
  { id:"sprite-can", name:"Sprite Can", category:"Drinks & Refreshments", description:"Chilled Sprite in a can.", priceKobo:250000, options:[{id:"pack-6",label:"Pack of 6 cans",priceKobo:1100000}] },
  { id:"7up-can", name:"7UP Can", category:"Drinks & Refreshments", description:"Chilled 7UP in a can.", priceKobo:250000, options:[{id:"pack-6",label:"Pack of 6 cans",priceKobo:1100000}] },
  { id:"pepsi-can", name:"Pepsi Can", category:"Drinks & Refreshments", description:"Chilled Pepsi in a can.", priceKobo:250000, options:[{id:"pack-6",label:"Pack of 6 cans",priceKobo:1100000}] }
];

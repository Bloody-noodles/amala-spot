import { drinkMenuItems } from "@/lib/drinks-menu";

export type MenuOption = { id: string; label: string; priceKobo: number };
export type MenuItem = {
  id: string; name: string; category: string; description: string;
  priceKobo: number; options: MenuOption[]; image?: string;
};

export const menuItems: MenuItem[] = [
  { id:"amala-abula", name:"Amala, Gbegiri & Ewedu", category:"Swallows", description:"Amala with the classic Yoruba duo, pepper stew and assorted meat.", priceKobo:450000, options:[{id:"beef",label:"Extra beef",priceKobo:120000},{id:"ponmo",label:"Extra ponmo",priceKobo:80000},{id:"assorted",label:"Extra assorted meat",priceKobo:180000}] },
  { id:"amala-ewedu", name:"Amala & Ewedu", category:"Swallows", description:"Soft amala with silky ewedu and pepper stew.", priceKobo:350000, options:[{id:"beef",label:"Extra beef",priceKobo:120000},{id:"ponmo",label:"Extra ponmo",priceKobo:80000}] },
  { id:"pounded-yam-egusi", name:"Pounded Yam & Egusi", category:"Swallows", description:"A hearty swallow pairing with rich egusi soup.", priceKobo:520000, options:[{id:"goat",label:"Goat meat",priceKobo:180000},{id:"fish",label:"Stockfish",priceKobo:150000},{id:"ponmo",label:"Extra ponmo",priceKobo:80000}] },
  { id:"eba-ogbono", name:"Eba & Ogbono", category:"Swallows", description:"Classic eba with draw-soup comfort.", priceKobo:420000, options:[{id:"beef",label:"Extra beef",priceKobo:120000},{id:"fish",label:"Stockfish",priceKobo:150000}] },
  { id:"jollof", name:"Smoky Jollof Rice", category:"Rice & Grains", description:"Nigerian-style jollof with a bold tomato-pepper base.", priceKobo:380000, options:[{id:"chicken",label:"Grilled chicken",priceKobo:220000},{id:"beef",label:"Beef",priceKobo:150000},{id:"plantain",label:"Add dodo",priceKobo:100000}] },
  { id:"fried-rice", name:"Nigerian Fried Rice", category:"Rice & Grains", description:"Colourful fried rice with vegetables and seasoning.", priceKobo:400000, options:[{id:"chicken",label:"Grilled chicken",priceKobo:220000},{id:"beef",label:"Beef",priceKobo:150000},{id:"plantain",label:"Add dodo",priceKobo:100000}] },
  { id:"ofada", name:"Ofada Rice & Ayamase", category:"Rice & Grains", description:"Local rice with signature green pepper sauce.", priceKobo:550000, options:[{id:"assorted",label:"Assorted meat",priceKobo:180000},{id:"egg",label:"Boiled egg",priceKobo:80000}] },
  { id:"beans", name:"Beans Porridge", category:"Rice & Grains", description:"Slow-cooked beans with palm oil and pepper.", priceKobo:320000, options:[{id:"plantain",label:"Add dodo",priceKobo:100000},{id:"fish",label:"Add fish",priceKobo:150000}] },
  { id:"egusi", name:"Egusi Soup", category:"Soups & Stews", description:"Melon-seed soup with leafy greens and rich seasoning.", priceKobo:350000, options:[{id:"beef",label:"Beef",priceKobo:120000},{id:"goat",label:"Goat meat",priceKobo:180000},{id:"fish",label:"Stockfish",priceKobo:150000}] },
  { id:"ewedu", name:"Ewedu", category:"Soups & Stews", description:"Silky jute-leaf soup, a Yoruba favourite.", priceKobo:180000, options:[{id:"gbegiri",label:"Add gbegiri",priceKobo:100000},{id:"stew",label:"Add pepper stew",priceKobo:100000}] },
  { id:"efo-riro", name:"Efo Riro", category:"Soups & Stews", description:"A rich vegetable stew with peppers and assorted ingredients.", priceKobo:350000, options:[{id:"beef",label:"Beef",priceKobo:120000},{id:"fish",label:"Stockfish",priceKobo:150000}] },
  { id:"asun", name:"Peppered Asun", category:"Grills & Protein", description:"Goat meat tossed with pepper, onions and spice.", priceKobo:650000, options:[{id:"large",label:"Large portion",priceKobo:250000}] },
  { id:"suya", name:"Beef Suya", category:"Grills & Protein", description:"Spiced grilled beef with onions and fresh pepper.", priceKobo:550000, options:[{id:"large",label:"Large portion",priceKobo:200000}] },
  { id:"pepper-soup", name:"Assorted Meat Pepper Soup", category:"Grills & Protein", description:"A warming peppery broth with assorted cuts.", priceKobo:600000, options:[{id:"goat",label:"Add goat meat",priceKobo:180000}] },
  { id:"dodo", name:"Dodo (Fried Plantain)", category:"Sides & Small Chops", description:"Sweet ripe plantain, fried golden.", priceKobo:180000, options:[{id:"large",label:"Large portion",priceKobo:100000}] },
  { id:"moi-moi", name:"Moi Moi", category:"Sides & Small Chops", description:"Steamed bean pudding, soft and savoury.", priceKobo:150000, options:[{id:"egg",label:"With egg",priceKobo:50000}] },
  ...drinkMenuItems
];

export const formatNaira = (kobo: number) => new Intl.NumberFormat("en-NG", {
  style:"currency", currency:"NGN", maximumFractionDigits:0
}).format(kobo / 100);

import { menuItems } from "@/lib/menu";

const galleryItemIds = new Set([
  "amala-abula", "amala-ewedu", "pounded-yam-egusi", "eba-ogbono", "jollof", "fried-rice", "beans",
  "egusi", "ewedu", "efo-riro", "asun", "suya", "pepper-soup", "dodo", "moi-moi",
  "zobo", "chapman", "geek-yoghurt", "tiger-nut-drink", "coca-cola", "fanta-orange", "pepsi",
  "maltina", "malta-guinness", "five-alive-pulpy", "coca-cola-can", "fanta-can"
]);

export const verifiedPhotoCount = menuItems.filter(item => item.image).length;
export const galleryCatalogueCount = menuItems.length;
export const galleryItems = menuItems.filter(item => galleryItemIds.has(item.id) && item.image);

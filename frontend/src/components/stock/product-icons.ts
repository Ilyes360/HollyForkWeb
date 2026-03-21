import {
  SteakIcon,
  ChickenThighsIcon,
  FishFoodIcon,
  CarrotIcon,
  BroccoliIcon,
  MushroomIcon,
  CornIcon,
  ApplePieIcon,
  BananaIcon,
  OrangeIcon,
  CherryIcon,
  GrapesIcon,
  WatermelonIcon,
  AvocadoIcon,
  Bread01Icon,
  CroissantIcon,
  CheeseIcon,
  EggIcon,
  WheatIcon,
  NoodlesIcon,
  RiceBowl01Icon,
  HoneyIcon,
  ChocolateIcon,
  CookieIcon,
  SoftDrink01Icon,
  Coffee01Icon,
  TeaIcon,
  DrinkIcon,
  BubbleTea01Icon,
  MilkCartonIcon,
  SaladIcon,
  Pizza01Icon,
  Sushi01Icon,
  PopcornIcon,
  CandyIcon,
  IceCream01Icon,
  NaturalFoodIcon,
  OrganicFoodIcon,
  SpoonAndForkIcon,
  PlateIcon,
  BbqGrillIcon,
  Pot01Icon,
  ServingFoodIcon,
  KitchenUtensilsIcon,
  ChefHatIcon,
  Knife01Icon,
  OvenIcon,
  BirthdayCakeIcon,
  CakeSliceIcon,
  Cupcake01Icon,
  SoftDrink02Icon,
} from "@hugeicons/core-free-icons"
import type { ProductCategory } from "./types"

export interface ProductIconEntry {
  key: string
  label: string
  icon: typeof SteakIcon
  category: ProductCategory | "all"
}

export const PRODUCT_ICONS: ProductIconEntry[] = [
  // Viandes
  { key: "steak", label: "Viande", icon: SteakIcon, category: "viandes" },
  { key: "chicken", label: "Volaille", icon: ChickenThighsIcon, category: "viandes" },
  { key: "bbq", label: "Grillades", icon: BbqGrillIcon, category: "viandes" },

  // Poissons
  { key: "fish", label: "Poisson", icon: FishFoodIcon, category: "poissons" },
  { key: "sushi", label: "Sushi", icon: Sushi01Icon, category: "poissons" },

  // Légumes / Fruits
  { key: "carrot", label: "Carotte", icon: CarrotIcon, category: "legumes" },
  { key: "broccoli", label: "Brocoli", icon: BroccoliIcon, category: "legumes" },
  { key: "mushroom", label: "Champignon", icon: MushroomIcon, category: "legumes" },
  { key: "corn", label: "Maïs", icon: CornIcon, category: "legumes" },
  { key: "salad", label: "Salade", icon: SaladIcon, category: "legumes" },
  { key: "avocado", label: "Avocat", icon: AvocadoIcon, category: "legumes" },
  { key: "lemon", label: "Citron", icon: OrangeIcon, category: "legumes" },
  { key: "apple", label: "Pomme", icon: ApplePieIcon, category: "legumes" },
  { key: "banana", label: "Banane", icon: BananaIcon, category: "legumes" },
  { key: "orange", label: "Orange", icon: OrangeIcon, category: "legumes" },
  { key: "cherry", label: "Cerise", icon: CherryIcon, category: "legumes" },
  { key: "grapes", label: "Raisin", icon: GrapesIcon, category: "legumes" },
  { key: "watermelon", label: "Pastèque", icon: WatermelonIcon, category: "legumes" },
  { key: "organic", label: "Bio", icon: OrganicFoodIcon, category: "legumes" },

  // Épicerie
  { key: "bread", label: "Pain", icon: Bread01Icon, category: "epicerie" },
  { key: "croissant", label: "Croissant", icon: CroissantIcon, category: "epicerie" },
  { key: "cheese", label: "Fromage", icon: CheeseIcon, category: "epicerie" },
  { key: "egg", label: "Oeuf", icon: EggIcon, category: "epicerie" },
  { key: "wheat", label: "Farine/Blé", icon: WheatIcon, category: "epicerie" },
  { key: "noodles", label: "Pâtes", icon: NoodlesIcon, category: "epicerie" },
  { key: "rice", label: "Riz", icon: RiceBowl01Icon, category: "epicerie" },
  { key: "honey", label: "Miel", icon: HoneyIcon, category: "epicerie" },
  { key: "chocolate", label: "Chocolat", icon: ChocolateIcon, category: "epicerie" },
  { key: "cookie", label: "Biscuit", icon: CookieIcon, category: "epicerie" },
  { key: "candy", label: "Bonbon", icon: CandyIcon, category: "epicerie" },
  { key: "cake", label: "Gâteau", icon: BirthdayCakeIcon, category: "epicerie" },
  { key: "cakeslice", label: "Part", icon: CakeSliceIcon, category: "epicerie" },
  { key: "cupcake", label: "Cupcake", icon: Cupcake01Icon, category: "epicerie" },
  { key: "pizza", label: "Pizza", icon: Pizza01Icon, category: "epicerie" },
  { key: "popcorn", label: "Popcorn", icon: PopcornIcon, category: "epicerie" },
  { key: "naturalfood", label: "Naturel", icon: NaturalFoodIcon, category: "epicerie" },

  // Boissons
  { key: "softdrink", label: "Soda", icon: SoftDrink01Icon, category: "boissons" },
  { key: "water", label: "Eau", icon: SoftDrink02Icon, category: "boissons" },
  { key: "coffee", label: "Café", icon: Coffee01Icon, category: "boissons" },
  { key: "tea", label: "Thé", icon: TeaIcon, category: "boissons" },
  { key: "drink", label: "Boisson", icon: DrinkIcon, category: "boissons" },
  { key: "bubbletea", label: "Bubble tea", icon: BubbleTea01Icon, category: "boissons" },
  { key: "milk", label: "Lait", icon: MilkCartonIcon, category: "boissons" },
  { key: "icecream", label: "Glace", icon: IceCream01Icon, category: "boissons" },

  // Autres / Général
  { key: "plate", label: "Assiette", icon: PlateIcon, category: "all" },
  { key: "pot", label: "Marmite", icon: Pot01Icon, category: "all" },
  { key: "serving", label: "Service", icon: ServingFoodIcon, category: "all" },
  { key: "utensils", label: "Ustensiles", icon: KitchenUtensilsIcon, category: "all" },
  { key: "chef", label: "Chef", icon: ChefHatIcon, category: "all" },
  { key: "knife", label: "Couteau", icon: Knife01Icon, category: "all" },
  { key: "oven", label: "Four", icon: OvenIcon, category: "all" },
  { key: "fork", label: "Couverts", icon: SpoonAndForkIcon, category: "all" },
]

export function getProductIcon(key: string | undefined) {
  if (!key) return null
  return PRODUCT_ICONS.find((i) => i.key === key) ?? null
}

export function getIconsForCategory(category: ProductCategory): ProductIconEntry[] {
  return PRODUCT_ICONS.filter(
    (i) => i.category === category || i.category === "all"
  )
}

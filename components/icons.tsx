import * as L from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Icons offered for categories, sub-categories and accounts (name -> picture). */
export const ICONS: Record<string, LucideIcon> = {
  "plus-circle": L.CirclePlus, building: L.Building2, bank: L.Landmark, cash: L.Banknote, wallet: L.Wallet, dollar: L.DollarSign,
  "bar-chart": L.ChartColumn, "line-chart": L.ChartLine, "pie-chart": L.ChartPie, home: L.House, house: L.House, briefcase: L.Briefcase,
  business: L.BriefcaseBusiness, utility: L.Zap, electric: L.Bolt, gas: L.Flame, internet: L.Wifi, water: L.Droplet, food: L.Utensils,
  "eating-out": L.UtensilsCrossed, restaurant: L.Pizza, kitchen: L.CookingPot, household: L.Sofa, grocery: L.ShoppingCart, car: L.Car,
  bus: L.Bus, truck: L.Truck, bike: L.Bike, aeroplane: L.Plane, train: L.Train, fuel: L.Fuel, medical: L.HeartPulse, medicine: L.Pill,
  doctor: L.Stethoscope, hospital: L.Hospital, shopping: L.ShoppingBag, shop: L.Store, "credit-card": L.CreditCard, family: L.Users,
  friend: L.UserRound, person: L.User, receipt: L.Receipt, payment: L.HandCoins, gift: L.Gift, education: L.GraduationCap, school: L.School,
  book: L.BookOpen, child: L.Baby, clothing: L.Shirt, shoes: L.Footprints, tv: L.Tv, movie: L.Film, mobile: L.Smartphone, laptop: L.Laptop,
  computer: L.Monitor, gold: L.Gem, coins: L.Coins, saving: L.PiggyBank, legal: L.Scale, court: L.Gavel, contract: L.FileText,
  client: L.Handshake, repair: L.Wrench, construction: L.Construction, bed: L.Bed, coffee: L.Coffee, milk: L.Milk, pet: L.Dog,
  garden: L.Leaf, vacation: L.Palmtree, hotel: L.Hotel, factory: L.Factory, warehouse: L.Warehouse, agriculture: L.Tractor,
  euro: L.Euro, pound: L.PoundSterling, yen: L.JapaneseYen, bitcoin: L.Bitcoin, rupee: L.IndianRupee, charity: L.HandHeart,
  mosque: L.Church, security: L.Shield, liability: L.TrendingDown, profit: L.TrendingUp, bill: L.ReceiptText, stock: L.Package,
  boxes: L.Boxes, job: L.ClipboardList, salary: L.Award, sports: L.Dumbbell, salon: L.Scissors, music: L.Music, games: L.Gamepad2,
  phone: L.Phone, travel: L.Globe, star: L.Star, love: L.Heart, rent: L.Lock,
};
export const ICON_NAMES = Object.keys(ICONS);

export function CatIcon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  const I = ICONS[name] ?? L.CirclePlus;
  return <I className={className} strokeWidth={1.6} aria-hidden />;
}

/** The 60 colours of the colour picker (same idea as MunshiBaba's swatch grid). */
export const COLORS = [
  "#E12428", "#026938", "#1BAEAA", "#F7941D", "#EC196E", "#38459B", "#6353A2", "#14B14B", "#92268E", "#944B43",
  "#E42127", "#107946", "#2BB3B1", "#F6A523", "#ED3680", "#3B5FAB", "#7163AB", "#3BBA44", "#9D3F9A", "#A7554D",
  "#EA6146", "#1E8955", "#3CB9B8", "#F5B628", "#EF5293", "#3D78BB", "#8072B4", "#61C33D", "#A957A6", "#BA5F57",
  "#EC755A", "#2C9963", "#4CBEC0", "#F5C82E", "#F06FA5", "#4092CB", "#8E82BD", "#88CB35", "#B470B2", "#CD6A62",
  "#EF967C", "#3AA972", "#5DC4C7", "#F4D933", "#F28BB8", "#42ABDB", "#9D91C6", "#AED42E", "#C088BE", "#E0746C",
  "#F1AA8D", "#48B980", "#6DC9CE", "#F3EA39", "#F3A8CA", "#45C5EB", "#ABA1CF", "#D5DD27", "#CBA1CA", "#F37E76",
];

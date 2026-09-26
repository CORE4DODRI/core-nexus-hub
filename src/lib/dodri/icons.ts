import {
  Activity,
  Boxes,
  Box,
  BarChart3,
  Briefcase,
  Calculator,
  CreditCard,
  Database,
  FileText,
  Headphones,
  LayoutGrid,
  LifeBuoy,
  Megaphone,
  Package,
  ShoppingCart,
  Store,
  Users,
  Warehouse,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/** Icons a module can declare in the registry. Keep this list open-ended. */
export const MODULE_ICONS: Record<string, LucideIcon> = {
  Box,
  Boxes,
  LayoutGrid,
  FileText,
  Package,
  ShoppingCart,
  Users,
  Store,
  Warehouse,
  Megaphone,
  Briefcase,
  LifeBuoy,
  Headphones,
  Calculator,
  CreditCard,
  Database,
  Activity,
  BarChart3,
  Workflow,
};

export const MODULE_ICON_NAMES = Object.keys(MODULE_ICONS);

export function moduleIcon(name?: string | null): LucideIcon {
  return (name && MODULE_ICONS[name]) || Box;
}

/**
 * Single source of truth for the sidebar's module structure. App.tsx
 * generates a <ComingSoonPage> route for every item marked
 * comingSoon, so adding a new placeholder module only means editing
 * this file -- not touching the router and the sidebar separately and
 * risking them drifting out of sync.
 */

import {
  LayoutDashboard, Building2, Users, FileText, Receipt,
  Layers, Grid3x3, Wrench, CalendarClock, TrendingDown,
  Wallet, CreditCard, BookOpen, BarChart3, PieChart,
  UserCog, ShieldCheck, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavLeaf {
  label: string;
  icon: LucideIcon;
  to?: string;         // real, built route
  comingSoon?: string; // unique path for the placeholder page
}

export interface NavGroup {
  group: string;
  items: NavLeaf[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    group: "Property Management",
    items: [
      { label: "Property List", icon: Building2, to: "/properties" },
      { label: "Property Registration", icon: Building2, to: "/properties/new" },
      { label: "Building", icon: Layers, to: "/buildings" },
      { label: "Floor", icon: Grid3x3, to: "/floors" },
      { label: "Unit", icon: Grid3x3, to: "/units" },
    ],
  },
  {
    group: "Tenant & Lease",
    items: [
      { label: "Tenant", icon: Users, to: "/tenants" },
      { label: "Lease Management", icon: FileText, to: "/leases" },
    ],
  },
  /*
  {
    group: "Rental Management",
    items: [
      { label: "Rent Invoice", icon: Receipt, to: "/invoices" },
      { label: "Rent Collection", icon: Wallet, comingSoon: "/coming-soon/rent-collection" },
      { label: "Arrears Management", icon: TrendingDown, comingSoon: "/coming-soon/arrears" },
    ],
  },
  {
    group: "Maintenance",
    items: [
      { label: "Work Order", icon: Wrench, comingSoon: "/coming-soon/work-order" },
      { label: "Preventive Maintenance", icon: CalendarClock, comingSoon: "/coming-soon/preventive-maintenance" },
    ],
  },
  {
    group: "Financial Management",
    items: [
      { label: "Accounts Receivable", icon: Wallet, comingSoon: "/coming-soon/accounts-receivable" },
      { label: "Accounts Payable", icon: CreditCard, comingSoon: "/coming-soon/accounts-payable" },
      { label: "Chart of Accounts", icon: BookOpen, comingSoon: "/coming-soon/chart-of-accounts" },
    ],
  },
  {
    group: "Reports & Analytics",
    items: [
      { label: "Reports", icon: BarChart3, comingSoon: "/coming-soon/reports" },
      { label: "Dashboards", icon: PieChart, comingSoon: "/coming-soon/dashboards" },
    ],
  },
  {
    group: "Settings",
    items: [
      { label: "Users", icon: UserCog, comingSoon: "/coming-soon/users" },
      { label: "Roles", icon: ShieldCheck, comingSoon: "/coming-soon/roles" },
      { label: "System Settings", icon: Settings, comingSoon: "/coming-soon/system-settings" },
    ],
  },
  */
];

export const DASHBOARD_ITEM: NavLeaf = { label: "Dashboard", icon: LayoutDashboard, to: "/" };

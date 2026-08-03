import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { NAV_GROUPS, DASHBOARD_ITEM, type NavLeaf } from "./navConfig";
import { Bell, Mail, HelpCircle, Search, LogOut, ChevronDown, ChevronRight, User, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function AppLayout() {
  const { logout } = useAuth();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-ink)] text-neutral-300 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 shrink-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-5 h-16 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-accent flex items-center justify-center text-[var(--color-ink)] font-bold text-sm">
              P
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">Property OS</span>
          </div>
          {/* Close button for mobile sidebar */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-neutral-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          <NavItem item={DASHBOARD_ITEM} onClick={() => setMobileMenuOpen(false)} />
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.group} group={group.group} items={group.items} onNavigate={() => setMobileMenuOpen(false)} />
          ))}
        </nav>

        <button
          onClick={logout}
          className="m-3 flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-neutral-400 hover:bg-white/5 hover:text-white transition-colors shrink-0"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0 gap-2 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                placeholder="Search..."
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <IconPopover icon={Bell} badge={0} title="Notifications" empty="No new notifications." />
            <IconPopover icon={Mail} badge={0} title="Messages" empty="No new messages." />
            <IconPopover icon={HelpCircle} title="Help" empty="Questions? Reach out to your account admin, or check the project docs." />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm pl-2 pr-1 py-1 rounded-md hover:bg-muted transition-colors ml-1">
                  <div className="h-7 w-7 rounded-full bg-accent/20 text-brass-dark flex items-center justify-center text-xs font-semibold">
                    {user?.full_name?.slice(0, 1).toUpperCase() ?? <User className="h-3.5 w-3.5" />}
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <div className="font-medium text-foreground">{user?.full_name ?? "..."}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user?.role?.replace(/_/g, " ") ?? ""}</div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.organization?.name ?? "Organization"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/coming-soon/profile")}>
                  <User className="h-4 w-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-danger">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarGroup({ group, items, onNavigate }: { group: string; items: NavLeaf[]; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        {group}
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {items.map((item) => (
            <NavItem key={item.label} item={item} onClick={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ item, onClick }: { item: NavLeaf; onClick?: () => void }) {
  const Icon = item.icon;
  const to = item.to ?? item.comingSoon!;
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
          isActive
            ? "bg-white/10 text-white font-medium border-l-2 border-accent -ml-px pl-[11px]"
            : "text-neutral-400 hover:bg-white/5 hover:text-white"
        )
      }
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function IconPopover({
  icon: Icon,
  badge,
  title,
  empty,
}: {
  icon: typeof Bell;
  badge?: number;
  title: string;
  empty: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative h-9 w-9 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground">
          <Icon className="h-4 w-4" />
          {!!badge && (
            <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-danger text-white text-[9px] leading-[14px] font-medium">
              {badge}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-sm text-muted-foreground">{empty}</p>
      </PopoverContent>
    </Popover>
  );
}
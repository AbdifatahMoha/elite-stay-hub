import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Users,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Layers,
  UserCog,
  UserCheck,
  Clapperboard,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LangSwitch } from "@/components/brand/LangSwitch";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/AuthProvider";
import { canAccessRoute, isAdmin } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  exact?: boolean;
  adminOnly?: boolean;
};

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { t } = useI18n();
  const { profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openMobile, setOpenMobile] = useState(false);

  const allItems: NavItem[] = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: t("dashboard"), exact: true },
    { to: "/admin/bookings", icon: CalendarCheck, label: t("bookings") },
    { to: "/admin/stories", icon: Clapperboard, label: t("storiesNav") },
    { to: "/admin/rooms", icon: BedDouble, label: t("rooms") },
    { to: "/admin/room-types", icon: Layers, label: "Room Types", adminOnly: true },
    { to: "/admin/guests", icon: Users, label: "Guests" },
    { to: "/admin/payments", icon: Wallet, label: t("payments") },
    { to: "/admin/reports", icon: BarChart3, label: t("reports"), adminOnly: true },
    { to: "/admin/approve-staff", icon: UserCheck, label: "Approve Staff", adminOnly: true },
    { to: "/admin/staff", icon: UserCog, label: "Staff", adminOnly: true },
    { to: "/admin/settings", icon: Settings, label: t("settings"), adminOnly: true },
  ];

  const items = profile
    ? allItems.filter((it) => !it.adminOnly || isAdmin(profile)).filter((it) => canAccessRoute(profile, it.to))
    : [];

  async function logout() {
    await signOut();
    navigate({ to: "/admin/login" });
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <p className="text-sm text-muted-foreground">Loading admin panel…</p>
      </div>
    );
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          openMobile ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Logo variant="light" />
          <button type="button" className="lg:hidden" onClick={() => setOpenMobile(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setOpenMobile(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <it.icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gold text-gold-foreground text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{profile.full_name}</div>
              <Badge className="mt-0.5 border-gold/40 bg-gold/10 text-gold text-[10px]" variant="outline">
                {profile.role}
              </Badge>
            </div>
            <button type="button" onClick={logout} title="Logout" className="text-sidebar-foreground/70 hover:text-sidebar-primary">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="lg:hidden" onClick={() => setOpenMobile(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              {title && <h1 className="truncate font-display text-lg font-semibold">{title}</h1>}
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <LangSwitch />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  {profile.full_name.split(" ")[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>{profile.email}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

/** @deprecated Use AdminShell via admin route layout */
export function AdminLayout(props: Parameters<typeof AdminShell>[0]) {
  return <AdminShell {...props} />;
}

import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Menu, X, Mail, Phone, MapPin, ChevronDown, LogIn, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LangSwitch } from "@/components/brand/LangSwitch";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isGuest, isHotelStaff } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function PublicLayout({
  children,
  transparentHeader = false,
}: {
  children: ReactNode;
  transparentHeader?: boolean;
}) {
  const { t } = useI18n();
  const { session, profile, loading, configured } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const guestSignedIn = configured && !loading && !!session && isGuest(profile);
  const staffSignedIn = configured && !loading && !!session && isHotelStaff(profile);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { to: "/", label: t("home"), exact: true },
    { to: "/rooms", label: t("rooms") },
    { to: "/check-booking", label: t("booking") },
    { to: "/about", label: t("about") },
    { to: "/contact", label: t("contact") },
  ] as const;

  const headerLight = transparentHeader && !scrolled;

  const outlineBtnClass = headerLight
    ? "border-white/30 text-white hover:bg-white/10 hover:text-white"
    : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted hover:text-foreground";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          headerLight
            ? "border-transparent bg-transparent"
            : scrolled
              ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-md"
              : "border-b border-border/60 bg-background"
        }`}
      >
        <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link to="/" className="relative z-10 shrink-0">
            <Logo variant={headerLight ? "light" : "dark"} />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex xl:gap-10">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`relative pb-1 text-sm font-medium transition-colors ${
                  headerLight ? "text-white/90 hover:text-white" : "text-muted-foreground hover:text-foreground"
                }`}
                activeOptions={{ exact: "exact" in n ? n.exact : false }}
                activeProps={{
                  className: headerLight
                    ? "!text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-gold"
                    : "!text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-gold",
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="relative z-10 hidden items-center gap-3 md:flex lg:gap-4">
            <LangSwitch variant={headerLight ? "light" : "dark"} />

            {guestSignedIn ? (
              <Button asChild variant="outline" size="sm" className={cn("rounded-lg border font-medium", outlineBtnClass)}>
                <Link to="/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" />{t("dashboard")}</Link>
              </Button>
            ) : staffSignedIn ? (
              <Button asChild variant="outline" size="sm" className={cn("rounded-lg border font-medium", outlineBtnClass)}>
                <Link to="/admin/dashboard"><ShieldCheck className="mr-1.5 h-4 w-4" />{t("dashboard")}</Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("rounded-lg border font-medium", outlineBtnClass)}>
                    <LogIn className="mr-1.5 h-4 w-4" />
                    {t("signIn")}
                    <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/signin" className="cursor-pointer">Guest Login</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/login" className="cursor-pointer">Staff Login</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button asChild className="rounded-lg bg-gold px-5 font-medium text-gold-foreground shadow-md hover:bg-gold/90">
              <Link to="/rooms">{t("bookNow")}</Link>
            </Button>
          </div>

          <button
            className={`relative z-10 md:hidden ${headerLight ? "text-white" : "text-foreground"}`}
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6">
              {nav.map((n) => (
                <Link key={`${n.to}-mobile`} to={n.to} onClick={() => setOpen(false)} className="text-sm font-medium text-foreground">
                  {n.label}
                </Link>
              ))}
              {guestSignedIn ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-primary">{t("dashboard")}</Link>
              ) : staffSignedIn ? (
                <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-primary">{t("dashboard")}</Link>
              ) : (
                <>
                  <Link to="/signin" onClick={() => setOpen(false)} className="text-sm font-medium text-primary">Guest Login</Link>
                  <Link to="/admin/login" onClick={() => setOpen(false)} className="text-sm font-medium text-primary">Staff Login</Link>
                </>
              )}
              <div className="flex items-center gap-4 pt-2">
                <LangSwitch />
                <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
                  <Link to="/rooms">{t("bookNow")}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className={cn("flex-1", !transparentHeader && "pt-20")}>{children}</main>

      <footer className="mt-auto border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <Logo variant="light" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/70">{t("footerTagline")}</p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">Navigate</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><Link to="/" className="hover:text-primary-foreground">{t("home")}</Link></li>
                <li><Link to="/rooms" className="hover:text-primary-foreground">{t("rooms")}</Link></li>
                <li><Link to="/check-booking" className="hover:text-primary-foreground">{t("booking")}</Link></li>
                <li><Link to="/signin" className="hover:text-primary-foreground">{t("signIn")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">Contact</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />Waddada Maka Al Mukarama, Mogadishu</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" />+252 61 000 0000</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" />hello@elitestay.com</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-primary-foreground/10 pt-8 text-sm text-primary-foreground/50 md:flex-row md:items-center">
            <span>© {new Date().getFullYear()} EliteStay — All rights reserved.</span>
            <LangSwitch variant="light" />
          </div>
        </div>
      </footer>
    </div>
  );
}

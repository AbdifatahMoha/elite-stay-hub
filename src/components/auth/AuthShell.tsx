import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LangSwitch } from "@/components/brand/LangSwitch";
import heroImg from "@/assets/hero-hotel.jpg";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  heroTitle?: string;
  heroSubtitle?: string;
  backTo?: string;
  backLabel?: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  heroTitle = "Welcome to EliteStay",
  heroSubtitle = "Experience refined hospitality — book your stay or manage hotel operations with confidence.",
  backTo = "/",
  backLabel = "Back to Home",
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={heroImg} alt="EliteStay" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/40" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-primary-foreground">
          <Logo variant="light" />
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">EliteStay</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">{heroTitle}</h2>
            <p className="mt-4 text-base leading-relaxed text-primary-foreground/85">{heroSubtitle}</p>
          </div>
          <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} EliteStay Hotel</p>
        </div>
      </div>

      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-6 lg:px-10">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="flex items-center gap-4">
            <div className="lg:hidden">
              <Logo />
            </div>
            <LangSwitch />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-10">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

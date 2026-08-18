import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Users, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function AvailabilityForm({
  defaults,
  variant = "default",
}: {
  defaults?: { checkIn?: string; checkOut?: string; guests?: number };
  variant?: "default" | "hero";
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(defaults?.checkIn ?? today());
  const [checkOut, setCheckOut] = useState(defaults?.checkOut ?? tomorrow());
  const [guests, setGuests] = useState(defaults?.guests ?? 2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (checkIn < today()) return toast.error("Check-in cannot be in the past.");
    if (checkOut <= checkIn) return toast.error("Check-out must be after check-in.");
    navigate({ to: "/search", search: { checkIn, checkOut, guests } });
  }

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={submit}
      className={
        isHero
          ? "grid grid-cols-1 gap-0 overflow-hidden rounded-2xl bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] md:grid-cols-[1fr_1fr_1fr_auto]"
          : "grid grid-cols-1 gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-lg md:grid-cols-[1fr_1fr_1fr_auto]"
      }
    >
      <div className="border-b border-border p-5 md:border-b-0 md:border-r">
        <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-gold" />
          {t("checkIn")}
        </label>
        <Input
          type="date"
          min={today()}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="h-auto border-0 bg-transparent p-0 text-base font-medium text-foreground shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="border-b border-border p-5 md:border-b-0 md:border-r">
        <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-gold" />
          {t("checkOut")}
        </label>
        <Input
          type="date"
          min={checkIn}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="h-auto border-0 bg-transparent p-0 text-base font-medium text-foreground shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="border-b border-border p-5 md:border-b-0 md:border-r">
        <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Users className="h-4 w-4 text-gold" />
          {t("guests")}
        </label>
        <Input
          type="number"
          min={1}
          max={8}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="h-auto border-0 bg-transparent p-0 text-base font-medium text-foreground shadow-none focus-visible:ring-0"
        />
      </div>
      <Button
        type="submit"
        className="h-full min-h-[72px] rounded-none bg-gold px-8 text-sm font-semibold tracking-wide text-gold-foreground hover:bg-gold/90"
      >
        {t("checkAvailability")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

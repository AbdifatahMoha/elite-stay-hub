import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { AvailabilityForm } from "@/components/public/AvailabilityForm";
import { checkRoomAvailability, useRoomTypes, useRooms } from "@/hooks/use-hotel-data";
import { formatMoney, nightsBetween } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HotelImage } from "@/components/ui/HotelImage";
import { Users, CalendarDays, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicRoomType } from "@/hooks/use-hotel-data";

type Search = { checkIn: string; checkOut: string; guests: number };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    checkIn: String(s.checkIn ?? ""),
    checkOut: String(s.checkOut ?? ""),
    guests: Number(s.guests ?? 2),
  }),
  component: SearchResults,
});

type AvailableType = {
  rt: PublicRoomType;
  roomId: string;
  roomNumber: string;
};

function SearchResults() {
  const { checkIn, checkOut, guests } = Route.useSearch();
  const { t } = useI18n();
  const { data: catalog = [] } = useRoomTypes();
  const { data: rooms = [] } = useRooms();
  const [available, setAvailable] = useState<AvailableType[]>([]);
  const [loading, setLoading] = useState(true);
  const nights = nightsBetween(checkIn, checkOut);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!checkIn || !checkOut) return;
      setLoading(true);
      const results: AvailableType[] = [];

      for (const rt of catalog.filter((r) => r.capacity >= guests)) {
        const units = rooms.filter((r) => r.roomTypeId === rt.id && r.status !== "MAINTENANCE");
        for (const unit of units) {
          const ok = await checkRoomAvailability(unit.id, checkIn, checkOut);
          if (ok) {
            results.push({ rt, roomId: unit.id, roomNumber: unit.roomNumber });
            break; // one free unit is enough to offer this type
          }
        }
      }

      if (!cancelled) {
        setAvailable(results);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [catalog, rooms, checkIn, checkOut, guests]);

  return (
    <PublicLayout>
      <section className="bg-primary py-12 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary-foreground/80">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">{t("availableRooms")}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-primary-foreground/80">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" /> {checkIn} → {checkOut}
            </span>
            <span>·</span>
            <span>
              {nights} {t("nights")}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {guests} {t("guests")}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-8 max-w-6xl px-4">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
          <AvailabilityForm defaults={{ checkIn, checkOut, guests }} />
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {loading ? (
          <p className="text-center text-muted-foreground">Checking availability…</p>
        ) : available.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <h3 className="font-display text-xl font-semibold">No rooms are available for the selected dates.</h3>
            <p className="mt-2 text-muted-foreground">Try different dates or a smaller party size.</p>
            <Button asChild className="mt-4">
              <Link to="/">Change Search Dates</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {available.map(({ rt, roomId }) => {
              const total = rt.pricePerNight * nights;
              return (
                <div
                  key={rt.id}
                  className="grid gap-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[280px_1fr_220px]"
                >
                  <div className="aspect-video overflow-hidden bg-muted md:aspect-auto md:min-h-[180px]">
                    <HotelImage
                      src={rt.imageUrl}
                      alt={rt.name}
                      className="h-full w-full"
                      width={560}
                      height={420}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-semibold">{rt.name}</h3>
                      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                        Available
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Up to {rt.capacity} guests</div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{rt.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {rt.amenities.slice(0, 5).map((a) => (
                        <Badge key={a} variant="secondary" className="text-[10px]">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between border-t border-border p-5 md:border-l md:border-t-0">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(rt.pricePerNight)} × {nights} {t("nights")}
                      </div>
                      <div className="mt-1 font-display text-2xl font-semibold">{formatMoney(total)}</div>
                    </div>
                    <Button asChild className="mt-3 bg-primary hover:bg-primary/90">
                      <Link to="/booking" search={{ roomId, checkIn, checkOut, guests }}>
                        {t("bookNow")}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

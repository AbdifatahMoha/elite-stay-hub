import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { AvailabilityForm } from "@/components/public/AvailabilityForm";
import { RoomCard } from "@/components/public/RoomCard";
import { useRoomTypes } from "@/hooks/use-hotel-data";
import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/rooms/")({
  head: () => ({ meta: [{ title: "Rooms — EliteStay" }, { name: "description", content: "Browse rooms and suites at EliteStay." }] }),
  component: RoomsPage,
});

function RoomsPage() {
  const { t } = useI18n();
  const { data: catalog = [], isLoading } = useRoomTypes();
  const [typeFilter, setTypeFilter] = useState("all");
  const [minCap, setMinCap] = useState("any");

  const typeOptions = useMemo(() => {
    const seen = new Map<string, (typeof catalog)[number]>();
    for (const item of catalog) {
      if (!seen.has(item.id)) seen.set(item.id, item);
    }
    return [...seen.values()];
  }, [catalog]);

  const priceCeiling = useMemo(
    () => Math.max(300, ...catalog.map((r) => r.pricePerNight), 300),
    [catalog],
  );
  const [maxPrice, setMaxPrice] = useState(priceCeiling);

  useEffect(() => {
    setMaxPrice((prev) => (prev > priceCeiling ? priceCeiling : prev));
  }, [priceCeiling]);

  const filtered = catalog.filter(
    (r) =>
      (typeFilter === "all" || r.id === typeFilter) &&
      r.pricePerNight <= maxPrice &&
      (minCap === "any" || r.capacity >= Number(minCap)),
  );

  return (
    <PublicLayout>
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <span className="text-sm font-semibold uppercase tracking-wider text-gold">{t("rooms")}</span>
          <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">{t("findRoom")}</h1>
          <p className="mt-3 max-w-xl text-primary-foreground/75">
            Browse our full collection and check real-time availability.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-8 max-w-5xl px-6 lg:px-10">
        <AvailabilityForm />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold">Filters</h3>
            <div className="mt-5 space-y-5">
              <div>
                <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Room Type
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {typeOptions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Max Price: ${maxPrice}
                </Label>
                <Slider
                  value={[maxPrice]}
                  min={50}
                  max={priceCeiling}
                  step={10}
                  onValueChange={(v) => setMaxPrice(v[0])}
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("capacity")}
                </Label>
                <Select value={minCap} onValueChange={setMinCap}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="2">2+ Guests</SelectItem>
                    <SelectItem value="3">3+ Guests</SelectItem>
                    <SelectItem value="4">4+ Guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{t("ourCollection")}</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-foreground">{t("curatedLivingSpaces")}</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              {isLoading
                ? "Loading rooms…"
                : `${filtered.length} room type${filtered.length === 1 ? "" : "s"}`}
            </p>
            <div className="mt-10 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r) => (
                <RoomCard key={r.catalogKey} room={r} variant="curated" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

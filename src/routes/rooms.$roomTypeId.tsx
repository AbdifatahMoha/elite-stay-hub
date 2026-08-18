import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { checkRoomAvailability, mapRoomType, useRoomTypeRecords, useRooms } from "@/hooks/use-hotel-data";
import { formatMoney } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RoomImageGallery } from "@/components/public/RoomImageGallery";
import { Wifi, Wind, Tv, Coffee, Bath, Waves, Car, Wine, Users, Check, X, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/rooms/$roomTypeId")({
  head: () => ({ meta: [{ title: "Room Details — EliteStay" }] }),
  component: RoomDetails,
  notFoundComponent: () => <div className="p-10 text-center">Room not found.</div>,
});

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  "WiFi": Wifi, "Air Conditioning": Wind, "TV": Tv, "Smart TV": Tv, "Breakfast": Coffee,
  "Private Bathroom": Bath, "Sea View": Waves, "Mini Bar": Wine, "Parking": Car,
};

function today() { return new Date().toISOString().slice(0, 10); }
function tomorrow() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); }

function RoomDetails() {
  const { roomTypeId } = Route.useParams();
  const { data: typeRecords = [] } = useRoomTypeRecords();
  const { data: rooms = [] } = useRooms();
  const dbType = typeRecords.find((r) => r.id === roomTypeId);
  const room = useMemo(
    () => (dbType ? mapRoomType(dbType, rooms.filter((r) => r.status !== "MAINTENANCE")) : undefined),
    [dbType, rooms],
  );
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [guests, setGuests] = useState(2);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState<null | { available: boolean; roomId?: string }>(null);

  const roomInventory = useMemo(
    () => rooms.filter((r) => r.roomTypeId === roomTypeId && r.status !== "MAINTENANCE"),
    [rooms, roomTypeId],
  );

  const galleryImages = useMemo(() => room?.images ?? [], [room]);

  if (!room) return <PublicLayout><div className="p-10 text-center">Room not found.</div></PublicLayout>;

  async function check() {
    if (checkOut <= checkIn) return toast.error("Check-out must be after check-in.");
    setChecking(true);
    try {
      let avail: { id: string } | undefined;
      for (const r of roomInventory) {
        const ok = await checkRoomAvailability(r.id, checkIn, checkOut);
        if (ok) { avail = r; break; }
      }
      setChecked({ available: !!avail, roomId: avail?.id });
    } finally {
      setChecking(false);
    }
  }

  function book() {
    if (!checked?.available || !checked.roomId) return toast.error("Check availability first.");
    navigate({ to: "/booking", search: { roomId: checked.roomId, checkIn, checkOut, guests } });
  }

  const displayName = lang === "so" ? room.nameSo : room.name;

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/rooms" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft className="h-4 w-4" /> Back to rooms</Link>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 lg:grid-cols-[1fr_380px]">
        <div>
          <RoomImageGallery images={galleryImages} alt={displayName} />

          <div className="mt-8">
            <p className="text-sm font-medium text-gold">{room.name}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">{displayName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Up to {room.capacity} guests</span>
              <span>·</span>
              <span>{formatMoney(room.pricePerNight)} / {t("perNight")}</span>
              {room.unitCount > 0 ? (
                <>
                  <span>·</span>
                  <span>{room.unitCount} room{room.unitCount === 1 ? "" : "s"} of this type</span>
                </>
              ) : null}
              {galleryImages.length > 1 ? (
                <>
                  <span>·</span>
                  <span>{galleryImages.length} photos</span>
                </>
              ) : null}
            </div>
            <p className="mt-6 text-muted-foreground">{room.description}</p>

            <h2 className="mt-10 font-display text-xl font-semibold">{t("amenities")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {room.amenities.map((a) => {
                const Icon = AMENITY_ICONS[a] ?? Check;
                return (
                  <div key={a} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                    <Icon className="h-4 w-4 text-gold" /> {a}
                  </div>
                );
              })}
            </div>

            <h2 className="mt-10 font-display text-xl font-semibold">Room Policies</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Check-in from 14:00 · Check-out by 12:00</li>
              <li>Non-smoking room. Pets not allowed.</li>
              <li>Free cancellation up to 48 hours before arrival.</li>
            </ul>
          </div>
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-semibold">{formatMoney(room.pricePerNight)}</span>
              <span className="text-sm text-muted-foreground">/ {t("perNight")}</span>
            </div>
            <div className="mt-5 space-y-3">
              <div>
                <Label className="text-xs">{t("checkIn")}</Label>
                <Input type="date" min={today()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t("checkOut")}</Label>
                <Input type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t("guests")}</Label>
                <Input type="number" min={1} max={room.capacity} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
              </div>
            </div>
            <Button className="mt-4 w-full bg-primary hover:bg-primary/90" onClick={check} disabled={checking}>
              {checking ? "Checking…" : t("checkAvailability")}
            </Button>

            {checked && checked.available && (
              <>
                <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success flex items-center gap-2">
                  <Check className="h-4 w-4" /> This room is available for your selected dates.
                </div>
                <Button className="mt-3 w-full bg-gold text-gold-foreground hover:bg-gold/90" onClick={book}>Book This Room</Button>
              </>
            )}
            {checked && !checked.available && (
              <>
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                  <X className="h-4 w-4" /> This room is unavailable for the selected dates.
                </div>
                <Button asChild variant="outline" className="mt-3 w-full"><Link to="/rooms">View Other Available Rooms</Link></Button>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-1.5">
              {room.amenities.slice(0, 5).map((a) => <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>)}
            </div>
          </div>
        </aside>
      </div>
    </PublicLayout>
  );
}

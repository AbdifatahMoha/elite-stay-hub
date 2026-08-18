import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { checkRoomAvailability, mapRoomType, submitPublicBooking, useRoomTypeRecords, useRooms } from "@/hooks/use-hotel-data";
import { getImageUrl } from "@/lib/getImageUrl";
import { formatMoney, nightsBetween } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HotelImage } from "@/components/ui/HotelImage";
import { AlertTriangle, Info } from "lucide-react";

type Search = { roomId: string; checkIn: string; checkOut: string; guests: number };

export const Route = createFileRoute("/booking")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    roomId: String(s.roomId ?? ""),
    checkIn: String(s.checkIn ?? ""),
    checkOut: String(s.checkOut ?? ""),
    guests: Number(s.guests ?? 2),
  }),
  component: BookingPage,
});

function BookingPage() {
  const { roomId, checkIn, checkOut, guests } = Route.useSearch();
  const { t } = useI18n();
  const { data: rooms = [] } = useRooms();
  const { data: typeRecords = [] } = useRoomTypeRecords();
  const navigate = useNavigate();
  const room = rooms.find((r) => r.id === roomId);
  const dbType = typeRecords.find((r) => r.id === room?.roomTypeId);
  const rt = useMemo(() => {
    if (!dbType || !room) return undefined;
    const base = mapRoomType(dbType, rooms);
    const images = room.images?.length ? room.images : base.images;
    const imageUrl = images[0] ?? room.imageUrl?.trim() ?? base.imageUrl;
    return { ...base, images, imageUrl, image: getImageUrl(imageUrl) };
  }, [dbType, room, rooms]);
  const nights = nightsBetween(checkIn, checkOut);
  const total = useMemo(() => (rt?.pricePerNight ?? 0) * nights, [rt, nights]);

  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "", nationality: "Somali", specialRequests: "" });
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    if (!room || !checkIn || !checkOut) return;
    checkRoomAvailability(room.id, checkIn, checkOut).then((avail) => setConflict(!avail));
  }, [room, checkIn, checkOut]);

  if (!room || !rt) {
    return <PublicLayout><div className="p-10 text-center">Room not found. <Link to="/rooms" className="text-primary underline">Browse rooms</Link></div></PublicLayout>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (conflict) return toast.error("Booking conflict detected. This room is already reserved for the selected dates.");
    if (!form.fullName || !form.email || !form.phone) return toast.error("Please complete required fields.");
    setSubmitting(true);
    try {
      const booking = await submitPublicBooking({
        guest: {
          full_name: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          nationality: form.nationality,
        },
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        number_of_guests: guests,
        total_amount: total,
        special_requests: form.specialRequests,
      });
      navigate({ to: "/booking-confirmation", search: { ref: booking.reference } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">Complete Your Booking</h1>
        <p className="mt-1 text-sm text-muted-foreground">Just a few details and we'll hold your room.</p>

        {conflict && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>Booking conflict detected. This room is already reserved for the selected dates. Please <Link to="/rooms" className="underline">choose another room</Link>.</div>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">{t("guestInformation")}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><Label>{t("fullName")} *</Label><Input value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} required /></div>
                <div><Label>{t("email")} *</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required /></div>
                <div><Label>{t("phone")} *</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required /></div>
                <div><Label>{t("nationality")}</Label><Input value={form.nationality} onChange={(e) => setForm({...form, nationality: e.target.value})} /></div>
                <div className="md:col-span-2"><Label>{t("address")}</Label><Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} /></div>
                <div className="md:col-span-2"><Label>{t("specialRequests")}</Label><Textarea rows={3} value={form.specialRequests} onChange={(e) => setForm({...form, specialRequests: e.target.value})} /></div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">{t("stayDetails")}</h2>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                <div><div className="text-muted-foreground">Room</div><div className="font-medium">{rt.name} · #{room.roomNumber}</div></div>
                <div><div className="text-muted-foreground">{t("checkIn")}</div><div className="font-medium">{checkIn}</div></div>
                <div><div className="text-muted-foreground">{t("checkOut")}</div><div className="font-medium">{checkOut}</div></div>
              </div>
            </section>

            <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/10 p-4 text-sm text-info">
              <Info className="mt-0.5 h-4 w-4" />
              <div>{t("paymentByStaff")}</div>
            </div>
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-display text-lg font-semibold">{t("bookingSummary")}</h3>
              <div className="mt-4 overflow-hidden rounded-lg bg-muted">
                <HotelImage src={rt.imageUrl} alt={rt.name} className="aspect-video w-full" loading="lazy" />
              </div>
              <div className="mt-4 text-sm">
                <div className="font-medium">{rt.name}</div>
                <div className="mt-2 flex justify-between text-muted-foreground"><span>Room #</span><span>{room.roomNumber}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>{t("pricePerNight")}</span><span>{formatMoney(rt.pricePerNight)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>{t("checkIn")}</span><span>{checkIn}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>{t("checkOut")}</span><span>{checkOut}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>{t("nights")}</span><span>{nights}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>{t("guests")}</span><span>{guests}</span></div>
                <div className="mt-3 border-t border-border pt-3 flex justify-between font-semibold">
                  <span>{t("totalAmount")}</span><span>{formatMoney(total)}</span>
                </div>
              </div>
              <Button type="submit" disabled={submitting || conflict} className="mt-5 w-full bg-primary hover:bg-primary/90">{submitting ? "Submitting..." : t("submitBooking")}</Button>
            </div>
          </aside>
        </form>
      </div>
    </PublicLayout>
  );
}

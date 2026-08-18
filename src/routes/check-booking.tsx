import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { lookupBooking } from "@/hooks/use-hotel-data";
import { formatMoney, nightsBetween } from "@/lib/formatters";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Search } from "lucide-react";
import type { Booking } from "@/types/database";

type SearchP = { ref?: string };

export const Route = createFileRoute("/check-booking")({
  validateSearch: (s: Record<string, unknown>): SearchP => ({ ref: s.ref ? String(s.ref) : undefined }),
  component: CheckBooking,
});

type LookupResult =
  | { ok: true; booking: Booking; guestName: string; roomName: string }
  | { ok: false };

function CheckBooking() {
  const { ref: initialRef } = Route.useSearch();
  const { t } = useI18n();
  const [ref, setRef] = useState(initialRef ?? "");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRef) lookup(initialRef);
  }, [initialRef]);

  async function lookup(reference: string) {
    setLoading(true);
    try {
      const booking = await lookupBooking(reference.trim());
      if (!booking) {
        setResult({ ok: false });
        return;
      }
      if (contact) {
        const email = booking.guest?.email?.toLowerCase() ?? "";
        const phone = booking.guest?.phone ?? "";
        if (contact && contact !== email && contact !== phone) {
          setResult({ ok: false });
          return;
        }
      }
      const rt = booking.room?.room_type?.name ?? "Room";
      const roomNum = booking.room?.room_number ?? "";
      setResult({
        ok: true,
        booking,
        guestName: booking.guest?.full_name ?? "-",
        roomName: `${rt} · #${roomNum}`,
      });
    } finally {
      setLoading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    lookup(ref);
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-3xl font-semibold">{t("checkYourBooking")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your booking reference and contact to view your booking status.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-6">
          <div><Label>{t("bookingReference")}</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="EST-2026-00125" /></div>
          <div><Label>{t("email")} / {t("phone")}</Label><Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Optional" /></div>
          <Button className="bg-primary hover:bg-primary/90" disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            {loading ? "Searching…" : t("checkStatus")}
          </Button>
        </form>

        {result && (
          result.ok ? (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Booking</div>
                  <div className="font-display text-lg font-semibold">{result.booking.reference}</div>
                </div>
                <StatusBadge status={result.booking.status} />
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span>{result.guestName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span>{result.roomName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span>{result.booking.check_in}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span>{result.booking.check_out}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nights</span><span>{nightsBetween(result.booking.check_in, result.booking.check_out)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>{formatMoney(Number(result.booking.total_amount))}</span></div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              No booking found with that reference.
            </div>
          )
        )}
      </div>
    </PublicLayout>
  );
}

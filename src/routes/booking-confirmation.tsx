import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { lookupBooking } from "@/hooks/use-hotel-data";
import { formatMoney, nightsBetween } from "@/lib/formatters";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Booking } from "@/types/database";

type Search = { ref: string };

export const Route = createFileRoute("/booking-confirmation")({
  validateSearch: (s: Record<string, unknown>): Search => ({ ref: String(s.ref ?? "") }),
  component: Confirmation,
});

function Confirmation() {
  const { ref } = Route.useSearch();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lookupBooking(ref).then((b) => {
      setBooking(b);
      setLoading(false);
    });
  }, [ref]);

  if (loading) {
    return <PublicLayout><div className="p-10 text-center text-muted-foreground">Loading confirmation…</div></PublicLayout>;
  }

  if (!booking) {
    return <PublicLayout><div className="p-10 text-center">Booking not found.</div></PublicLayout>;
  }

  const rt = booking.room?.room_type?.name ?? "-";
  const roomNum = booking.room?.room_number ?? "";

  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Booking Request Submitted</h1>
          <p className="mt-2 text-sm text-muted-foreground">Thank you. Your booking request has been received and is currently pending confirmation.</p>
          <div className="mt-6 rounded-lg border border-dashed border-border p-4">
            <div className="text-xs text-muted-foreground">Booking Reference</div>
            <div className="mt-1 font-display text-xl font-semibold tracking-wide text-primary">{booking.reference}</div>
          </div>
          <div className="mt-6 space-y-2 text-left text-sm">
            <Row label="Guest" value={booking.guest?.full_name ?? "-"} />
            <Row label="Room" value={`${rt} · #${roomNum}`} />
            <Row label="Check-in" value={booking.check_in} />
            <Row label="Check-out" value={booking.check_out} />
            <Row label="Nights" value={String(nightsBetween(booking.check_in, booking.check_out))} />
            <Row label="Total" value={formatMoney(Number(booking.total_amount))} />
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={booking.status} />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline"><Link to="/check-booking" search={{ ref: booking.reference }}>Check Booking Status</Link></Button>
            <Button asChild className="bg-primary hover:bg-primary/90"><Link to="/">Return Home</Link></Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

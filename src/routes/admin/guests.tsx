import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useGuests, useBookings, usePayments, useUpdateGuest } from "@/hooks/use-hotel-data";
import { formatMoney } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/guests")({ component: GuestsPage });

function GuestsPage() {
  const { data: guests = [], isLoading } = useGuests();
  const { data: bookings = [] } = useBookings();
  const { data: payments = [] } = usePayments();
  const updateGuest = useUpdateGuest();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return guests
      .filter((g) => {
        if (!q) return true;
        const s = `${g.full_name} ${g.email} ${g.phone}`.toLowerCase();
        return s.includes(q.toLowerCase());
      })
      .map((g) => {
        const guestBookings = bookings.filter((b) => b.guest_id === g.id);
        const guestPayments = payments.filter((p) => guestBookings.some((b) => b.id === p.booking_id));
        const spend = guestPayments.reduce((s, p) => s + Number(p.amount), 0);
        const lastStay = guestBookings.sort((a, b) => b.check_in.localeCompare(a.check_in))[0]?.check_in ?? "—";
        return { guest: g, bookings: guestBookings.length, spend, lastStay };
      });
  }, [guests, bookings, payments, q]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading guests…</p>;

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Guest Management</h2>
        <p className="text-sm text-muted-foreground">Search guests, view history, and manage accounts.</p>
      </div>

      <Card className="p-5">
        <div className="relative mb-4 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guests…" className="pl-9" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 text-left">Guest</th>
                <th className="text-left">Email</th>
                <th className="text-left">Phone</th>
                <th className="text-left">Bookings</th>
                <th className="text-right">Spend</th>
                <th className="text-left">Last Stay</th>
                <th className="text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ guest, bookings: bc, spend, lastStay }) => (
                <tr key={guest.id} className="border-b border-border/60">
                  <td className="py-3 font-medium">{guest.full_name}</td>
                  <td>{guest.email}</td>
                  <td>{guest.phone}</td>
                  <td>{bc}</td>
                  <td className="text-right">{formatMoney(spend)}</td>
                  <td>{lastStay}</td>
                  <td>{guest.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await updateGuest.mutateAsync({ id: guest.id, patch: { is_active: !guest.is_active } });
                          toast.success(guest.is_active ? "Guest deactivated" : "Guest activated");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Update failed");
                        }
                      }}
                    >
                      {guest.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

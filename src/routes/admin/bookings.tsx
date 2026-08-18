import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useBookings, usePayments, useUpdateBookingStatus } from "@/hooks/use-hotel-data";
import { formatMoney, nightsBetween } from "@/lib/formatters";
import type { BookingStatus } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bookings")({ component: BookingsPage });

function BookingsPage() {
  const { data: bookings = [], isLoading } = useBookings();
  const updateStatus = useUpdateBookingStatus();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      bookings.filter((b) => {
        if (status !== "all" && b.status !== status) return false;
        if (q) {
          const s = `${b.reference} ${b.guest?.full_name ?? ""} ${b.guest?.email ?? ""}`.toLowerCase();
          if (!s.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [bookings, status, q],
  );

  async function changeStatus(id: string, s: BookingStatus) {
    try {
      await updateStatus.mutateAsync({ id, status: s });
      toast.success(`Booking ${s.replaceAll("_", " ").toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  const details = detailsId ? bookings.find((b) => b.id === detailsId) : null;
  const { data: payments = [] } = usePayments();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading bookings…</p>;

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Booking Management</h2>
        <p className="text-sm text-muted-foreground">Search, approve, check in/out, and cancel reservations.</p>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, guest, email…" className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CHECKED_IN">Checked In</SelectItem>
              <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Booking
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 text-left">Reference</th>
                <th className="text-left">Guest</th>
                <th className="text-left">Room</th>
                <th className="text-left">Check In</th>
                <th className="text-left">Check Out</th>
                <th className="text-right">Total</th>
                <th className="text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-border/60 hover:bg-muted/40">
                  <td className="py-3 font-medium">{b.reference}</td>
                  <td>{b.guest?.full_name}</td>
                  <td>
                    {b.room?.room_type?.name} · #{b.room?.room_number}
                  </td>
                  <td>{b.check_in}</td>
                  <td>{b.check_out}</td>
                  <td className="text-right font-medium">{formatMoney(Number(b.total_amount))}</td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailsId(b.id)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeStatus(b.id, "CONFIRMED")}>Confirm</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeStatus(b.id, "CHECKED_IN")}>Check In</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeStatus(b.id, "CHECKED_OUT")}>Check Out</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => changeStatus(b.id, "CANCELLED")}>
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!details} onOpenChange={(o) => !o && setDetailsId(null)}>
        <DialogContent className="max-w-2xl">
          {details && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 font-display">
                  {details.reference} <StatusBadge status={details.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Guest</div>
                  <p>{details.guest?.full_name}</p>
                  <p className="text-muted-foreground">{details.guest?.email}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Stay</div>
                  <p>
                    {details.room?.room_type?.name} #{details.room?.room_number}
                  </p>
                  <p>
                    {details.check_in} → {details.check_out} ({nightsBetween(details.check_in, details.check_out)} nights)
                  </p>
                </div>
              </div>
              <div className="text-sm">
                Paid:{" "}
                {formatMoney(
                  payments.filter((p) => p.booking_id === details.id).reduce((s, p) => s + Number(p.amount), 0),
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePayments, useBookings, useCreatePayment } from "@/hooks/use-hotel-data";
import { formatMoney } from "@/lib/formatters";
import type { PaymentMethod, PaymentStatus } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payments")({ component: PaymentsPage });

function PaymentsPage() {
  const { data: payments = [], isLoading } = usePayments();
  const { data: bookings = [] } = useBookings();
  const createPayment = useCreatePayment();
  const [open, setOpen] = useState(false);

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
  const pending = payments.filter((p) => p.status === "PENDING" || p.status === "UNPAID").length;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading payments…</p>;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Payment Management</h2>
          <p className="text-sm text-muted-foreground">Cash, invoice, and future-ready payment methods.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total Collected</div><div className="mt-1 font-display text-2xl font-semibold">{formatMoney(totalPaid)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Transactions</div><div className="mt-1 font-display text-2xl font-semibold">{payments.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Pending</div><div className="mt-1 font-display text-2xl font-semibold text-warning">{pending}</div></Card>
      </div>

      <Card className="p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 text-left">Date</th>
              <th className="text-left">Booking</th>
              <th className="text-left">Guest</th>
              <th className="text-left">Method</th>
              <th className="text-right">Amount</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const booking = bookings.find((b) => b.id === p.booking_id);
              return (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="py-3">{p.payment_date}</td>
                  <td>{booking?.reference ?? p.booking_id.slice(0, 8)}</td>
                  <td>{booking?.guest?.full_name}</td>
                  <td>{p.method}</td>
                  <td className="text-right font-medium">{formatMoney(Number(p.amount))}</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <PaymentForm
            bookings={bookings}
            onSubmit={async (values) => {
              try {
                await createPayment.mutateAsync(values);
                setOpen(false);
                toast.success("Payment recorded");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function PaymentForm({
  bookings,
  onSubmit,
}: {
  bookings: { id: string; reference: string; guest?: { full_name: string } | null }[];
  onSubmit: (v: { booking_id: string; amount: number; method: PaymentMethod; status: PaymentStatus; reference_number?: string }) => void;
}) {
  const [bookingId, setBookingId] = useState(bookings[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [status, setStatus] = useState<PaymentStatus>("PAID");
  const [ref, setRef] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ booking_id: bookingId, amount: Number(amount), method, status, reference_number: ref || undefined });
      }}
    >
      <div>
        <Label>Booking</Label>
        <Select value={bookingId} onValueChange={setBookingId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {bookings.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.reference} — {b.guest?.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
      <div>
        <Label>Method</Label>
        <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Invoice">Invoice</SelectItem>
            <SelectItem value="Stripe">Stripe</SelectItem>
            <SelectItem value="Mobile Money">Mobile Money</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Reference #</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} /></div>
      <Button type="submit" className="w-full">Save Payment</Button>
    </form>
  );
}

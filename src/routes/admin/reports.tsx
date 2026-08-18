import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useBookings, useRooms, usePayments, useRoomTypeRecords } from "@/hooks/use-hotel-data";
import { formatMoney, nightsBetween } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/reports")({ component: ReportsPage });

function ReportsPage() {
  const { data: bookings = [] } = useBookings();
  const { data: rooms = [] } = useRooms();
  const { data: payments = [] } = usePayments();
  const { data: roomTypes = [] } = useRoomTypeRecords();
  const [range, setRange] = useState("monthly");

  const revenue = payments.filter((p) => p.status === "PAID" || p.status === "PARTIAL").reduce((s, p) => s + Number(p.amount), 0);
  const occupied = rooms.filter((r) => r.status === "OCCUPIED").length;
  const occupancy = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;

  const monthly = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const key = d.toISOString().slice(0, 7);
        const rev = bookings
          .filter((b) => b.check_in.startsWith(key) && b.status !== "CANCELLED")
          .reduce((s, b) => s + Number(b.total_amount), 0);
        return { month: d.toLocaleString(undefined, { month: "short" }), revenue: rev, bookings: bookings.filter((b) => b.check_in.startsWith(key)).length };
      }),
    [bookings],
  );

  const perf = roomTypes.map((rt) => {
    const typeRooms = rooms.filter((r) => r.roomTypeId === rt.id);
    const typeBookings = bookings.filter((b) => typeRooms.some((room) => room.id === b.room_id) && b.status !== "CANCELLED");
    const rev = typeBookings.reduce((s, b) => s + Number(b.total_amount), 0);
    const nights = typeBookings.reduce((s, b) => s + nightsBetween(b.check_in, b.check_out), 0);
    return { name: rt.name, bookings: typeBookings.length, revenue: rev, nights };
  });

  function exportCsv() {
    const header = "Reference,Guest,Check In,Check Out,Amount,Status\n";
    const rows = bookings.map((b) =>
      [b.reference, b.guest?.full_name, b.check_in, b.check_out, b.total_amount, b.status].join(","),
    );
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "elitestay-report.csv";
    a.click();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Reports</h2>
          <p className="text-sm text-muted-foreground">Revenue, occupancy, bookings, and room performance.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Revenue</div><div className="mt-1 font-display text-2xl font-semibold">{formatMoney(revenue)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Occupancy</div><div className="mt-1 font-display text-2xl font-semibold">{occupancy}%</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Bookings</div><div className="mt-1 font-display text-2xl font-semibold">{bookings.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Guests</div><div className="mt-1 font-display text-2xl font-semibold">{new Set(bookings.map((b) => b.guest_id)).size}</div></Card>
      </div>

      <Tabs value={range} onValueChange={setRange} className="mt-6">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        <TabsContent value={range} className="mt-4">
          <Card className="p-5">
            <h3 className="font-display text-lg font-semibold">Booking Trends</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#1F2A44" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6 p-5 overflow-x-auto">
        <h3 className="font-display text-lg font-semibold">Room Type Performance</h3>
        <table className="mt-4 w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 text-left">Room Type</th>
              <th className="text-right">Bookings</th>
              <th className="text-right">Nights</th>
              <th className="text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {perf.map((row) => (
              <tr key={row.name} className="border-b border-border/60">
                <td className="py-3 font-medium">{row.name}</td>
                <td className="text-right">{row.bookings}</td>
                <td className="text-right">{row.nights}</td>
                <td className="text-right">{formatMoney(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

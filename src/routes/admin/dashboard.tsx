import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatMoney, todayStr } from "@/lib/formatters";
import { useBookings, useRooms, usePayments, useGuests, useAllStories } from "@/hooks/use-hotel-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StoryForm } from "@/components/admin/StoryForm";
import { AuthorAvatar } from "@/components/public/StoryViewerModal";
import { ArrowUpRight, CalendarPlus, BedDouble, DollarSign, TrendingUp, Users, Clapperboard, Plus } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { profile } = useAuth();
  const { data: bookings = [] } = useBookings();
  const { data: rooms = [] } = useRooms();
  const { data: payments = [] } = usePayments();
  const { data: guests = [] } = useGuests();
  const { data: stories = [] } = useAllStories();
  const [storyOpen, setStoryOpen] = useState(false);
  const today = todayStr();

  const totalRevenue = payments
    .filter((p) => p.status === "PAID" || p.status === "PARTIAL")
    .reduce((s, p) => s + Number(p.amount), 0);
  const occupied = rooms.filter((r) => r.status === "OCCUPIED").length;
  const occupancy = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const todaysBookings = bookings.filter((b) => b.check_in === today || b.created_at.startsWith(today)).length;
  const recent = [...bookings].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleString(undefined, { month: "short" });
    const monthKey = d.toISOString().slice(0, 7);
    const rev = bookings
      .filter((b) => b.check_in.startsWith(monthKey) && b.status !== "CANCELLED")
      .reduce((s, b) => s + Number(b.total_amount), 0);
    const count = bookings.filter((b) => b.check_in.startsWith(monthKey)).length;
    return { month: label, revenue: rev, bookings: count };
  });

  const statusData = [
    { name: "Pending", value: bookings.filter((b) => b.status === "PENDING").length, color: "hsl(45 90% 55%)" },
    { name: "Confirmed", value: bookings.filter((b) => b.status === "CONFIRMED").length, color: "hsl(145 60% 45%)" },
    { name: "Checked In", value: bookings.filter((b) => b.status === "CHECKED_IN").length, color: "hsl(280 60% 55%)" },
    { name: "Cancelled", value: bookings.filter((b) => b.status === "CANCELLED").length, color: "hsl(0 65% 55%)" },
  ];

  const firstName = profile?.full_name.split(" ")[0] ?? "Admin";

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Good morning, {firstName}</h2>
          <p className="text-sm text-muted-foreground">Live hotel overview from Supabase.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/bookings">View bookings</Link>
        </Button>
      </div>

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">EliteStay Stories</h3>
            <p className="text-sm text-muted-foreground">Publish a vertical clip for the homepage, same as FaithState stories.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setStoryOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Story
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/stories">
                <Clapperboard className="mr-1.5 h-4 w-4" />
                Manage
              </Link>
            </Button>
          </div>
        </div>
        {stories.length > 0 && (
          <div className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto pb-1">
            {stories.slice(0, 8).map((story) => (
              <div key={story.id} className="w-[110px] shrink-0">
                <div className="aspect-[9/16] overflow-hidden rounded-xl bg-muted">
                  {story.media_type === "video" ? (
                    <video src={story.media_url} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <img src={story.thumbnail_url || story.media_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <AuthorAvatar name={story.author_name} photo={story.author_photo} className="h-5 w-5" />
                  <p className="truncate text-[11px] text-muted-foreground">{story.author_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={storyOpen} onOpenChange={setStoryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Story</DialogTitle>
          </DialogHeader>
          <StoryForm onCreated={() => setStoryOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Kpi icon={CalendarPlus} label="Today's Bookings" value={String(todaysBookings)} tone="info" />
        <Kpi icon={BedDouble} label="Occupied Rooms" value={String(occupied)} tone="purple" />
        <Kpi icon={BedDouble} label="Available Rooms" value={String(availableRooms)} tone="gold" />
        <Kpi icon={Users} label="Guests" value={String(guests.length)} tone="info" />
        <Kpi icon={DollarSign} label="Revenue" value={formatMoney(totalRevenue)} tone="success" />
        <Kpi icon={TrendingUp} label="Pending" value={String(pending)} tone="warning" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="col-span-2 p-5">
          <h3 className="font-display text-lg font-semibold">Monthly Revenue</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#B58948" fill="#B5894820" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold">Occupancy</h3>
          <div className="mt-6 text-center">
            <div className="font-display text-5xl font-semibold">{occupancy}%</div>
            <p className="mt-2 text-sm text-muted-foreground">{occupied} of {rooms.length} rooms occupied</p>
          </div>
          <div className="mt-6 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={40} outerRadius={70} dataKey="value" nameKey="name">
                  {statusData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Booking Trends</h3>
        </div>
        <div className="mt-4 h-56">
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

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Recent Bookings</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/bookings">
              View all <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
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
                <th className="text-right">Amount</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id} className="border-b border-border/60">
                  <td className="py-3 font-medium">{b.reference}</td>
                  <td>{b.guest?.full_name}</td>
                  <td>{b.room?.room_type?.name ?? "—"} #{b.room?.room_number}</td>
                  <td>{b.check_in}</td>
                  <td className="text-right">{formatMoney(Number(b.total_amount))}</td>
                  <td>
                    <StatusBadge status={b.status} />
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

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarPlus;
  label: string;
  value: string;
  tone: "info" | "purple" | "success" | "gold" | "warning";
}) {
  const toneMap = {
    info: "bg-info/10 text-info",
    purple: "bg-purple/10 text-purple",
    success: "bg-success/10 text-success",
    gold: "bg-gold/15 text-gold",
    warning: "bg-warning/10 text-warning",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

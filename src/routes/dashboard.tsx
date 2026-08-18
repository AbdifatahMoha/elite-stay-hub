import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { requireGuestAuth } from "@/lib/auth/guest-guard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { PublicLayout } from "@/components/public/PublicLayout";
import { useBookings, useUpdateProfile } from "@/hooks/use-hotel-data";
import { formatMoney, nightsBetween } from "@/lib/formatters";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CalendarCheck, LogOut, User } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => requireGuestAuth(),
  head: () => ({ meta: [{ title: "My Dashboard — EliteStay" }] }),
  component: GuestDashboard,
});

function GuestDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: allBookings = [] } = useBookings();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  });

  const myBookings = useMemo(
    () => allBookings.filter((b) => b.guest?.email?.toLowerCase() === profile?.email?.toLowerCase()),
    [allBookings, profile?.email],
  );

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        patch: { full_name: form.full_name, phone: form.phone || null },
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function logout() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <PublicLayout>
      <section className="bg-primary py-12 text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">Guest Dashboard</p>
            <h1 className="mt-1 font-display text-3xl font-semibold">Welcome, {profile?.full_name.split(" ")[0]}</h1>
            <p className="mt-2 text-primary-foreground/75">Manage your profile and view your booking history.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link to="/rooms">Book a Room</Link>
            </Button>
            <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings"><CalendarCheck className="mr-2 h-4 w-4" />My Bookings</TabsTrigger>
            <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            {myBookings.length === 0 ? (
              <Card className="p-10 text-center">
                <p className="text-muted-foreground">No bookings yet.</p>
                <Button asChild className="mt-4"><Link to="/rooms">Browse Rooms</Link></Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {myBookings.map((b) => (
                  <Card key={b.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-display text-lg font-semibold">{b.reference}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {b.room?.room_type?.name ?? "Room"} · #{b.room?.room_number ?? "—"}
                        </div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm md:grid-cols-4">
                      <div><span className="text-muted-foreground">Check-in</span><div>{b.check_in}</div></div>
                      <div><span className="text-muted-foreground">Check-out</span><div>{b.check_out}</div></div>
                      <div><span className="text-muted-foreground">Nights</span><div>{nightsBetween(b.check_in, b.check_out)}</div></div>
                      <div><span className="text-muted-foreground">Total</span><div className="font-semibold">{formatMoney(Number(b.total_amount))}</div></div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card className="max-w-lg p-6">
              <form onSubmit={saveProfile} className="space-y-4">
                <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={profile?.email ?? ""} disabled /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <Button type="submit">Save Profile</Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PublicLayout>
  );
}

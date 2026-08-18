import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useHotelSettings, useUpdateSettings } from "@/hooks/use-hotel-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const { data: settings, isLoading } = useHotelSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState({
    hotel_name: "",
    address: "",
    phone: "",
    email: "",
    currency: "USD",
    tax_rate: "0",
    check_in_time: "14:00",
    check_out_time: "11:00",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        hotel_name: settings.hotel_name,
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
        currency: settings.currency,
        tax_rate: String(settings.tax_rate),
        check_in_time: settings.check_in_time.slice(0, 5),
        check_out_time: settings.check_out_time.slice(0, 5),
      });
    }
  }, [settings]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading settings…</p>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        patch: {
          hotel_name: form.hotel_name,
          address: form.address,
          phone: form.phone,
          email: form.email,
          currency: form.currency,
          tax_rate: Number(form.tax_rate),
          check_in_time: form.check_in_time,
          check_out_time: form.check_out_time,
          languages: settings.languages,
        },
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Hotel Settings</h2>
        <p className="text-sm text-muted-foreground">All values stored in Supabase — nothing hardcoded.</p>
      </div>

      <Card className="max-w-2xl p-6">
        <form onSubmit={save} className="space-y-4">
          <div><Label>Hotel Name</Label><Input value={form.hotel_name} onChange={(e) => setForm({ ...form, hotel_name: e.target.value })} /></div>
          <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            <div><Label>Tax Rate (%)</Label><Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Check-In Time</Label><Input type="time" value={form.check_in_time} onChange={(e) => setForm({ ...form, check_in_time: e.target.value })} /></div>
            <div><Label>Check-Out Time</Label><Input type="time" value={form.check_out_time} onChange={(e) => setForm({ ...form, check_out_time: e.target.value })} /></div>
          </div>
          <div><Label>Languages</Label><Input value={(settings?.languages ?? ["en", "so"]).join(", ")} disabled /></div>
          <Button type="submit">Save Settings</Button>
        </form>
      </Card>
    </>
  );
}

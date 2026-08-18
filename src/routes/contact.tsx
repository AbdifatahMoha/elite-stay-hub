import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { useHotelSettings } from "@/hooks/use-hotel-data";
import { useI18n } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase";
import { submitContactMessage } from "@/services/contact.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "Contact — EliteStay" }, { name: "description", content: "Get in touch with EliteStay." }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const { data: settings } = useHotelSettings();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", message: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      toast.error("Messaging is temporarily unavailable. Please call or email the hotel directly.");
      return;
    }
    setSubmitting(true);
    try {
      await submitContactMessage(form);
      toast.success("Message sent. Our team will respond shortly.");
      setForm({ full_name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <span className="text-sm font-semibold uppercase tracking-wider text-gold">Contact</span>
          <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">Get in Touch</h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/75">
            Questions about your stay or a group booking? We are here to help.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:px-10">
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
            <MapPin className="mt-0.5 h-5 w-5 text-gold" />
            <div>
              <div className="font-medium">{settings?.hotel_name ?? "EliteStay"}</div>
              <p className="mt-1 text-sm text-muted-foreground">{settings?.address ?? "Mogadishu, Somalia"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
            <Phone className="mt-0.5 h-5 w-5 text-gold" />
            <div>
              <div className="font-medium">Phone</div>
              <p className="mt-1 text-sm text-muted-foreground">{settings?.phone ?? "+252 61 000 0000"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
            <Mail className="mt-0.5 h-5 w-5 text-gold" />
            <div>
              <div className="font-medium">Email</div>
              <p className="mt-1 text-sm text-muted-foreground">{settings?.email ?? "info@elitestay.com"}</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold">Send a Message</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label>{t("fullName")}</Label>
              <Input
                required
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t("email")}</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t("phone")}</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                rows={5}
                required
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
              {submitting ? "Sending…" : "Send Message"}
            </Button>
          </div>
        </form>
      </section>
    </PublicLayout>
  );
}

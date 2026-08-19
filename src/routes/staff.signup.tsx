import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthUnavailableNotice } from "@/components/auth/AuthUnavailableNotice";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseConfigStatus } from "@/lib/supabase";

type Search = { pending?: string };

export const Route = createFileRoute("/staff/signup")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    pending: s.pending ? String(s.pending) : undefined,
  }),
  head: () => ({ meta: [{ title: "Staff Registration — EliteStay" }] }),
  component: StaffSignUpPage,
});

function StaffSignUpPage() {
  const { pending } = Route.useSearch();
  const navigate = useNavigate();
  const { signUp, configured } = useAuth();
  const [submitted, setSubmitted] = useState(pending === "1");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    password: "",
    confirm: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pending === "1") setSubmitted(true);
  }, [pending]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      const status = getSupabaseConfigStatus();
      console.error("[EliteStay] staff signup blocked", status);
      toast.error(status.message ?? "Registration is unavailable. Please try again later.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone,
        position: form.position,
        role: "PENDING_STAFF",
      });
      setSubmitted(true);
      toast.success("Application submitted");
    } catch (err) {
      console.error("[EliteStay] staff signup failed", err);
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <AuthShell
        title="Application submitted"
        heroTitle="Staff Portal"
        heroSubtitle="Join the EliteStay team and help deliver exceptional hospitality."
      >
        <div className="rounded-xl border border-success/30 bg-success/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            Your account has been created successfully. Your account is awaiting administrator approval before you can access the staff portal.
          </p>
          <Button asChild className="mt-6 w-full" variant="outline">
            <Link to="/admin/login">Return to Staff Login</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create a staff account"
      subtitle="Register to join the EliteStay team. An administrator must approve your account before you can sign in."
      heroTitle="Staff Portal"
      heroSubtitle="Join the EliteStay team and help deliver exceptional hospitality."
    >
      <AuthUnavailableNotice />
      <form onSubmit={submit} className="space-y-4">
        <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
        <div><Label>Position</Label><Input placeholder="e.g. Receptionist" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required /></div>
        <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></div>
        <div><Label>Confirm Password</Label><Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required minLength={8} /></div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
          {submitting ? "Submitting…" : "Create Staff Account"}
        </Button>
      </form>

      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/admin/login" className="font-semibold text-primary hover:text-gold">
          Staff Sign In
        </Link>
      </div>
    </AuthShell>
  );
}

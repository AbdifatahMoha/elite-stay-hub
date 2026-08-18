import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthUnavailableNotice } from "@/components/auth/AuthUnavailableNotice";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Account — EliteStay" }] }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, configured } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.error("Registration is unavailable. Please try again later.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      const result = await signUp({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone,
        role: "GUEST",
      });
      toast.success("Account created successfully");
      navigate({ to: result.redirect });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join EliteStay to book rooms and manage your stays."
      heroTitle="Begin your EliteStay journey"
      heroSubtitle="Create a guest account to browse suites, reserve rooms, and track your bookings."
    >
      <AuthUnavailableNotice />
      <form onSubmit={submit} className="space-y-4">
        <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div><Label>Phone Number</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
        <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></div>
        <div><Label>Confirm Password</Label><Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required minLength={8} /></div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={submitting}>
          {submitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-primary hover:text-gold">
          Sign In
        </Link>
      </div>
    </AuthShell>
  );
}

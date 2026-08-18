import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthUnavailableNotice } from "@/components/auth/AuthUnavailableNotice";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isHotelStaff } from "@/lib/auth/roles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Staff Portal — EliteStay" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn, session, profile, loading, configured, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && profile && isHotelStaff(profile)) {
      navigate({ to: "/admin/dashboard" });
    }
  }, [loading, session, profile, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.error("Staff login is unavailable. Please try again later.");
      return;
    }
    setSubmitting(true);
    try {
      const path = await signIn(email.trim(), password, "staff");
      toast.success("Signed in successfully");
      navigate({ to: path });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onForgotPassword() {
    if (!email.trim()) return toast.error("Enter your email first");
    try {
      await resetPassword(email.trim(), "/admin/login");
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    }
  }

  return (
    <AuthShell
      title="Staff sign in"
      subtitle="Authorized hotel personnel only. Guest accounts cannot access this portal."
      heroTitle="Staff Portal"
      heroSubtitle="Secure administration for bookings, rooms, guests, and reports."
    >
      <AuthUnavailableNotice />
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
        <ShieldCheck className="h-3 w-3" /> Hotel Staff Only
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <button type="button" onClick={onForgotPassword} className="text-xs text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        Need a staff account?{" "}
        <Link to="/staff/signup" className="font-semibold text-primary hover:text-gold">
          Create one here
        </Link>
      </div>
    </AuthShell>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthUnavailableNotice } from "@/components/auth/AuthUnavailableNotice";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isGuest } from "@/lib/auth/roles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSupabaseConfigStatus } from "@/lib/supabase";

export const Route = createFileRoute("/signin")({
  head: () => ({ meta: [{ title: "Sign In — EliteStay" }] }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { signIn, session, profile, loading, configured, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && profile && isGuest(profile)) {
      navigate({ to: "/dashboard" });
    }
  }, [loading, session, profile, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      const status = getSupabaseConfigStatus();
      console.error("[EliteStay] guest sign-in blocked", status);
      toast.error(status.message ?? "Authentication is unavailable. Please try again later.");
      return;
    }
    setSubmitting(true);
    try {
      const path = await signIn(email.trim(), password, "guest");
      toast.success("Welcome back");
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
      await resetPassword(email.trim(), "/signin");
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    }
  }

  return (
    <AuthShell
      title="Sign in to your account"
      subtitle="Access your bookings, profile, and reservation history."
      heroTitle="Your journey continues"
      heroSubtitle="Sign in to manage bookings, update your profile, and enjoy a seamless EliteStay experience."
    >
      <AuthUnavailableNotice />
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button type="button" onClick={onForgotPassword} className="text-xs text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-semibold text-primary hover:text-gold">
          Create Account
        </Link>
      </div>
    </AuthShell>
  );
}

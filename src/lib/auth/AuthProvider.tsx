import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured, logSupabaseConfigWarning, resetSupabaseClient } from "@/lib/supabase";
import { applyPublicSupabaseEnv, logClientEnvProbe } from "@/lib/supabase-env";
import { getPublicSupabaseConfig } from "@/lib/public-supabase-config";
import { fetchProfile, upsertProfileAfterSignup } from "@/services/profiles.service";
import {
  getPostLoginPath,
  getStaffLoginPath,
  isGuest,
  isHotelStaff,
  isPendingStaff,
} from "@/lib/auth/roles";
import type { Profile, UserRole } from "@/types/database";

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
};

type SignUpInput = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: UserRole;
  position?: string;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string, portal?: "guest" | "staff") => Promise<string>;
  signUp: (input: SignUpInput) => Promise<{ redirect: string; pendingApproval?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, redirectPath?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(() => isSupabaseConfigured());

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
      return p;
    } catch (error) {
      console.error("[EliteStay] failed to load profile", error);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function boot() {
      logClientEnvProbe("auth-boot-start");
      logSupabaseConfigWarning();

      if (!isSupabaseConfigured()) {
        try {
          const cfg = await getPublicSupabaseConfig();
          console.info("[EliteStay] loaded public supabase config from server", {
            urlSet: Boolean(cfg.supabaseUrl),
            anonKeySet: Boolean(cfg.supabaseAnonKey),
          });
          applyPublicSupabaseEnv(cfg);
          resetSupabaseClient();
        } catch (error) {
          console.error("[EliteStay] failed to load public supabase config", error);
        }
      }

      if (cancelled) return;
      const ready = isSupabaseConfigured();
      setConfigured(ready);
      logClientEnvProbe("auth-boot-after-server-config");

      if (!ready) {
        console.error("[EliteStay] auth unavailable: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not present at build or runtime");
        setLoading(false);
        return;
      }

      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("[EliteStay] supabase.auth.getSession failed", error);
      if (cancelled) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadProfile(data.session.user.id);
      if (!cancelled) setLoading(false);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) loadProfile(s.user.id);
        else setProfile(null);
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    }

    boot().catch((error) => {
      console.error("[EliteStay] auth boot failed", error);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string, portal: "guest" | "staff" = "guest") => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Sign in failed");

    const p = await fetchProfile(data.user.id);
    if (!p) throw new Error("Profile not found. Please contact support.");

    if (portal === "guest") {
      if (!isGuest(p)) throw new Error("This account is not a guest account. Use Staff Login instead.");
      setProfile(p);
      return "/dashboard";
    }

    if (isPendingStaff(p)) {
      await supabase.auth.signOut();
      throw new Error("Your account is awaiting administrator approval before you can access the staff portal.");
    }

    if (!isHotelStaff(p)) {
      await supabase.auth.signOut();
      throw new Error("This account is not authorized for the staff portal.");
    }

    setProfile(p);
    return getStaffLoginPath(p) ?? "/admin/dashboard";
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const supabase = getSupabase();
    const status = input.role === "PENDING_STAFF" ? "PENDING" : "ACTIVE";

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          full_name: input.full_name,
          phone: input.phone,
          role: input.role,
          position: input.position ?? null,
          status,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error("Registration failed");

    const profilePatch = await upsertProfileAfterSignup(data.user.id, {
      email: input.email.trim(),
      full_name: input.full_name,
      phone: input.phone || null,
      role: input.role,
      status,
      position: input.position ?? null,
    });

    if (input.role === "PENDING_STAFF") {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
      setUser(null);
      return { redirect: "/staff/signup", pendingApproval: true };
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      setProfile(profilePatch);
    }

    return { redirect: getPostLoginPath(profilePatch) };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string, redirectPath = "/signin") => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${redirectPath}`,
    });
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      configured,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile,
    }),
    [session, user, profile, loading, configured, signIn, signUp, signOut, resetPassword, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

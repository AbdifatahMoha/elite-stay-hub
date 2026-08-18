import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { UserRole } from "@/types/database";

const hotelRoles = ["ADMIN", "MANAGER", "RECEPTIONIST", "HOUSEKEEPING", "STAFF"] as const satisfies readonly UserRole[];

const inviteStaffInput = z.object({
  accessToken: z.string().min(1),
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: z.enum(hotelRoles),
});

async function requireAdminCaller(accessToken: string) {
  const { getSupabaseAdmin } = await import("@/lib/supabase-admin.server");
  const url = process.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase client env is not configured on the server.");

  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
  if (userError || !userData.user) throw new Error("Unauthorized — sign in again.");

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.role !== "ADMIN" || profile.status !== "ACTIVE") {
    throw new Error("Only active administrators can invite staff.");
  }

  return { admin };
}

export const inviteStaffMember = createServerFn({ method: "POST" })
  .validator(inviteStaffInput)
  .handler(async ({ data }) => {
    const { getServerSupabaseConfigStatus } = await import("@/lib/supabase-admin.server");
    if (!getServerSupabaseConfigStatus().configured) {
      throw new Error(
        "Staff invitations require SUPABASE_SERVICE_ROLE_KEY in .env (server-only). See .env.example.",
      );
    }

    const { admin } = await requireAdminCaller(data.accessToken);
    const redirectTo = `${process.env.APP_URL ?? "http://localhost:8080"}/admin/login`;

    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.full_name, role: data.role },
      redirectTo,
    });

    if (inviteError) throw inviteError;
    if (!inviteData.user) throw new Error("Invitation failed — no user returned.");

    const { error: profileError } = await admin.from("profiles").upsert({
      id: inviteData.user.id,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      role: data.role,
      status: "ACTIVE",
    });

    if (profileError) throw profileError;

    return {
      id: inviteData.user.id,
      email: data.email,
      message: "Invitation sent. The staff member will receive an email to set their password.",
    };
  });

import type { Profile, UserRole } from "@/types/database";
import {
  ADMIN_ONLY_ROUTES,
  HOTEL_STAFF_ROLES,
  HOUSEKEEPING_ROUTES,
  MANAGER_ROUTES,
  RECEPTIONIST_ROUTES,
} from "@/types/database";

export function isGuest(profile: Profile | null | undefined): boolean {
  return profile?.role === "GUEST" && profile.status === "ACTIVE";
}

export function isHotelStaff(profile: Profile | null | undefined): boolean {
  return !!profile && profile.status === "ACTIVE" && HOTEL_STAFF_ROLES.includes(profile.role);
}

export function isPendingStaff(profile: Profile | null | undefined): boolean {
  return profile?.role === "PENDING_STAFF" || profile?.status === "PENDING";
}

export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === "ADMIN" && profile.status === "ACTIVE";
}

export function getPostLoginPath(profile: Profile): string {
  if (profile.role === "GUEST" && profile.status === "ACTIVE") return "/dashboard";
  if (isPendingStaff(profile)) return "/staff/signup";
  if (isHotelStaff(profile)) return "/admin/dashboard";
  return "/signin";
}

export function getStaffLoginPath(profile: Profile): string | null {
  if (isPendingStaff(profile)) return null;
  if (isHotelStaff(profile)) return "/admin/dashboard";
  return null;
}

export function canAccessAdminRoute(profile: Profile, pathname: string): boolean {
  if (!isHotelStaff(profile)) return false;
  if (profile.role === "ADMIN") return true;

  if (ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) return false;

  const allowed = routesForRole(profile.role);
  return allowed.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

function routesForRole(role: UserRole): readonly string[] {
  switch (role) {
    case "MANAGER":
      return MANAGER_ROUTES;
    case "RECEPTIONIST":
      return RECEPTIONIST_ROUTES;
    case "HOUSEKEEPING":
      return HOUSEKEEPING_ROUTES;
    case "STAFF":
      return ["/admin/dashboard", "/admin/bookings", "/admin/guests", "/admin/stories"];
    default:
      return [];
  }
}

export function canAccessRoute(profile: Profile, pathname: string): boolean {
  return canAccessAdminRoute(profile, pathname);
}

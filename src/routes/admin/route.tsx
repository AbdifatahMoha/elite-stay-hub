import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminLayout";
import { requireAdminAuth } from "@/lib/auth/admin-guard";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") return;
    return requireAdminAuth(location.pathname);
  },
  component: AdminRouteLayout,
});

function AdminRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/admin/login") return <Outlet />;
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}

import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout parent for /rooms and /rooms/$roomTypeId — children render via Outlet. */
export const Route = createFileRoute("/rooms")({
  component: RoomsLayout,
});

function RoomsLayout() {
  return <Outlet />;
}

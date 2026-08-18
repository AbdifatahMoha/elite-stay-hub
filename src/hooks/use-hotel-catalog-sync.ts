import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { queryKeys } from "@/hooks/use-hotel-data";

/** Keeps public pages in sync when admin adds/edits rooms or room types. */
export function useHotelCatalogSync() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabase();
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.roomTypes });
      qc.invalidateQueries({ queryKey: queryKeys.rooms });
    };

    const channel = supabase
      .channel("elitestay-hotel-catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_types" }, invalidate)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}

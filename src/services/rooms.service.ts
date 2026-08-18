import { getSupabase } from "@/lib/supabase";
import { HOTEL_ASSETS_BUCKET, normalizeStoragePath } from "@/lib/getImageUrl";
import { collectImageUrls, syncCoverFields } from "@/lib/roomImages";
import type { Room, RoomStatus } from "@/types/database";

function normalizeRoom(row: Room): Room {
  const image_urls = collectImageUrls(row.image_urls, row.image_url);
  return { ...row, ...syncCoverFields(image_urls) };
}

export async function fetchRooms(): Promise<Room[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_type:room_types(*)")
    .order("room_number");
  if (error) throw error;
  return ((data ?? []) as Room[]).map(normalizeRoom);
}

export async function createRoom(input: {
  room_number: string;
  room_type_id: string;
  status?: RoomStatus;
  image_url?: string | null;
  image_urls?: string[];
}) {
  if (!input.room_type_id?.trim()) {
    throw new Error("Every room must belong to a room type.");
  }
  const supabase = getSupabase();
  const cover = syncCoverFields(collectImageUrls(input.image_urls, input.image_url));
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      room_number: input.room_number,
      room_type_id: input.room_type_id,
      status: input.status ?? "AVAILABLE",
      ...cover,
    })
    .select("*, room_type:room_types(*)")
    .single();
  if (error) throw error;
  return normalizeRoom(data as Room);
}

export async function updateRoom(id: string, patch: Partial<Omit<Room, "id" | "created_at" | "room_type">>) {
  if (patch.room_type_id !== undefined && !patch.room_type_id?.trim()) {
    throw new Error("Every room must belong to a room type.");
  }
  const supabase = getSupabase();
  const nextPatch = { ...patch };
  if (patch.image_urls !== undefined || patch.image_url !== undefined) {
    Object.assign(nextPatch, syncCoverFields(collectImageUrls(patch.image_urls, patch.image_url)));
  }
  const { data, error } = await supabase
    .from("rooms")
    .update(nextPatch)
    .eq("id", id)
    .select("*, room_type:room_types(*)")
    .single();
  if (error) throw error;
  return normalizeRoom(data as Room);
}

/** Delete a physical room and any bookings/payments attached to it. */
export async function deleteRoom(id: string) {
  const supabase = getSupabase();

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id")
    .eq("room_id", id);
  if (bookingsError) throw bookingsError;

  const bookingIds = (bookings ?? []).map((b) => b.id);
  if (bookingIds.length > 0) {
    const { error: paymentsError } = await supabase.from("payments").delete().in("booking_id", bookingIds);
    if (paymentsError) throw paymentsError;

    const { error: deleteBookingsError } = await supabase.from("bookings").delete().in("id", bookingIds);
    if (deleteBookingsError) throw deleteBookingsError;
  }

  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) throw error;
}

export async function countRoomsForType(roomTypeId: string) {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("rooms")
    .select("id", { count: "exact", head: true })
    .eq("room_type_id", roomTypeId);
  if (error) throw error;
  return count ?? 0;
}

function uniqueObjectPath(folder: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  return `${folder}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
}

/** Upload one room photo; returns public URL. */
export async function uploadRoomImage(file: File, roomId: string) {
  const supabase = getSupabase();
  const path = uniqueObjectPath(`rooms/${roomId}`, file);
  const { error: uploadError } = await supabase.storage.from(HOTEL_ASSETS_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(HOTEL_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload many room photos; returns public URLs in selection order. */
export async function uploadRoomImages(files: File[], roomId: string) {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadRoomImage(file, roomId));
  }
  return urls;
}

/** Best-effort delete of a hotel-assets object from its public URL. */
export async function removeStoredImage(publicUrl: string) {
  try {
    const marker = `/${HOTEL_ASSETS_BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = normalizeStoragePath(decodeURIComponent(publicUrl.slice(idx + marker.length).split("?")[0] ?? ""));
    if (!path) return;
    await getSupabase().storage.from(HOTEL_ASSETS_BUCKET).remove([path]);
  } catch {
    // Non-fatal: DB gallery update still proceeds.
  }
}

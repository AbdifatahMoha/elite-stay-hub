import { getSupabase } from "@/lib/supabase";
import { HOTEL_ASSETS_BUCKET } from "@/lib/getImageUrl";
import { collectImageUrls, syncCoverFields } from "@/lib/roomImages";
import { deleteRoom } from "@/services/rooms.service";
import type { RoomType } from "@/types/database";

function normalizeRoomType(row: RoomType): RoomType {
  const image_urls = collectImageUrls(row.image_urls, row.image_url);
  return { ...row, ...syncCoverFields(image_urls) };
}

export async function fetchRoomTypes(): Promise<RoomType[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("room_types").select("*").order("price_per_night");
  if (error) throw error;
  return ((data ?? []) as RoomType[]).map(normalizeRoomType);
}

export async function createRoomType(
  input: Omit<RoomType, "id" | "created_at" | "image_url" | "image_urls"> & {
    image_url?: string | null;
    image_urls?: string[];
  },
) {
  const supabase = getSupabase();
  const cover = syncCoverFields(collectImageUrls(input.image_urls, input.image_url));
  const { data, error } = await supabase
    .from("room_types")
    .insert({
      name: input.name,
      name_so: input.name_so,
      description: input.description,
      price_per_night: input.price_per_night,
      capacity: input.capacity,
      amenities: input.amenities,
      ...cover,
    })
    .select()
    .single();
  if (error) throw error;
  return normalizeRoomType(data as RoomType);
}

export async function updateRoomType(id: string, patch: Partial<Omit<RoomType, "id" | "created_at">>) {
  const supabase = getSupabase();
  const nextPatch = { ...patch };
  if (patch.image_urls !== undefined || patch.image_url !== undefined) {
    Object.assign(nextPatch, syncCoverFields(collectImageUrls(patch.image_urls, patch.image_url)));
  }
  const { data, error } = await supabase.from("room_types").update(nextPatch).eq("id", id).select().single();
  if (error) throw error;
  return normalizeRoomType(data as RoomType);
}

/**
 * Delete a room type and every physical room under it
 * (rooms cascade also removes their bookings/payments).
 */
export async function deleteRoomType(id: string) {
  const supabase = getSupabase();
  const { data: rooms, error: roomsError } = await supabase.from("rooms").select("id").eq("room_type_id", id);
  if (roomsError) throw roomsError;

  for (const room of rooms ?? []) {
    await deleteRoom(room.id);
  }

  const { error } = await supabase.from("room_types").delete().eq("id", id);
  if (error) throw error;
}

function uniqueObjectPath(folder: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  return `${folder}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
}

export async function uploadRoomTypeImage(file: File, roomTypeId: string) {
  const supabase = getSupabase();
  const path = uniqueObjectPath(`room-types/${roomTypeId}`, file);
  const { error: uploadError } = await supabase.storage.from(HOTEL_ASSETS_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(HOTEL_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadRoomTypeImages(files: File[], roomTypeId: string) {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadRoomTypeImage(file, roomTypeId));
  }
  return urls;
}

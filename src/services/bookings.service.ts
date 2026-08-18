import { getSupabase } from "@/lib/supabase";
import { generateBookingReference } from "@/lib/formatters";
import type { Booking, BookingStatus } from "@/types/database";

export async function fetchBookings(): Promise<Booking[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, guest:guests(*), room:rooms(*, room_type:room_types(*))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function fetchBookingByReference(reference: string): Promise<Booking | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, guest:guests(*), room:rooms(*, room_type:room_types(*))")
    .ilike("reference", reference)
    .maybeSingle();
  if (error) throw error;
  return data as Booking | null;
}

export async function createBooking(input: {
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  total_amount: number;
  special_requests?: string | null;
  status?: BookingStatus;
  reference?: string;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      ...input,
      reference: input.reference ?? generateBookingReference(),
      status: input.status ?? "PENDING",
    })
    .select("*, guest:guests(*), room:rooms(*, room_type:room_types(*))")
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("*, guest:guests(*), room:rooms(*, room_type:room_types(*))")
    .single();
  if (error) throw error;

  // Sync room status
  const roomId = (data as Booking).room_id;
  if (roomId) {
    let roomStatus: "AVAILABLE" | "OCCUPIED" | "RESERVED" = "AVAILABLE";
    if (status === "CHECKED_IN") roomStatus = "OCCUPIED";
    else if (status === "CONFIRMED") roomStatus = "RESERVED";
    else if (status === "CHECKED_OUT" || status === "CANCELLED") roomStatus = "AVAILABLE";
    await supabase.from("rooms").update({ status: roomStatus }).eq("id", roomId);
  }

  return data as Booking;
}

export async function isRoomAvailable(
  roomId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string,
): Promise<boolean> {
  if (!checkIn || !checkOut || checkIn >= checkOut) return false;
  const supabase = getSupabase();
  let query = supabase
    .from("bookings")
    .select("id")
    .eq("room_id", roomId)
    .in("status", ["CONFIRMED", "CHECKED_IN"])
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);
  if (excludeBookingId) query = query.neq("id", excludeBookingId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).length === 0;
}

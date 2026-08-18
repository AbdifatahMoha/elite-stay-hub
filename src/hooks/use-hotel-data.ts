import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as bookingsService from "@/services/bookings.service";
import * as guestsService from "@/services/guests.service";
import * as paymentsService from "@/services/payments.service";
import * as roomTypesService from "@/services/room-types.service";
import * as roomsService from "@/services/rooms.service";
import * as settingsService from "@/services/settings.service";
import * as profilesService from "@/services/profiles.service";
import * as storiesService from "@/services/stories.service";
import { getImageUrl } from "@/lib/getImageUrl";
import { collectImageUrls, coverFromImages } from "@/lib/roomImages";
import type { BookingStatus, PaymentMethod, PaymentStatus, RoomStatus } from "@/types/database";
import type { RoomType as DbRoomType, Room as DbRoom, Guest, Booking, Payment } from "@/types/database";

export const queryKeys = {
  roomTypes: ["room-types"] as const,
  rooms: ["rooms"] as const,
  guests: ["guests"] as const,
  bookings: ["bookings"] as const,
  payments: ["payments"] as const,
  settings: ["settings"] as const,
  profiles: ["profiles"] as const,
  stories: ["stories"] as const,
};

/**
 * Public listing card = a room TYPE (what guests book).
 * Physical room numbers are inventory only and assigned at booking time.
 */
export type PublicRoomType = {
  /** Room type id — used for detail routes. */
  id: string;
  /** Unique key for React lists. */
  catalogKey: string;
  name: string;
  nameSo: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  /** Resolved cover URL, or empty when no real photo. */
  image: string;
  /** Raw cover DB value (may be null). */
  imageUrl: string | null;
  /** Gallery URLs (raw); cover is first when present. */
  images: string[];
  /** Bookable physical rooms of this type (not under maintenance). */
  unitCount: number;
  /** True when this type should get the Bestseller badge (most photos). */
  isBestseller?: boolean;
};

type RoomImageSource = {
  room_type_id?: string;
  roomTypeId?: string;
  image_url?: string | null;
  imageUrl?: string | null;
  image_urls?: string[] | null;
  images?: string[] | null;
};

function imagesFromSource(source: {
  image_url?: string | null;
  imageUrl?: string | null;
  image_urls?: string[] | null;
  images?: string[] | null;
}) {
  return collectImageUrls(source.image_urls, source.images, source.image_url, source.imageUrl);
}

/** Type gallery first (marketing), then any photos from physical rooms of that type. */
export function resolveRoomTypeImages(rt: DbRoomType, rooms: RoomImageSource[] = []): string[] {
  const fromRooms: string[] = [];
  for (const room of rooms) {
    const typeId = room.room_type_id ?? room.roomTypeId;
    if (typeId !== rt.id) continue;
    fromRooms.push(...imagesFromSource(room));
  }
  return collectImageUrls(imagesFromSource(rt), fromRooms);
}

export function resolveRoomTypeImageUrl(rt: DbRoomType, rooms: RoomImageSource[] = []): string | null {
  return coverFromImages(resolveRoomTypeImages(rt, rooms));
}

export function mapRoomType(rt: DbRoomType, rooms: RoomImageSource[] = []): PublicRoomType {
  const images = resolveRoomTypeImages(rt, rooms);
  const imageUrl = coverFromImages(images);
  const unitCount = rooms.filter((r) => {
    const typeId = r.room_type_id ?? r.roomTypeId;
    return typeId === rt.id;
  }).length;
  return {
    id: rt.id,
    catalogKey: rt.id,
    name: rt.name,
    nameSo: rt.name_so,
    description: rt.description,
    pricePerNight: Number(rt.price_per_night),
    capacity: rt.capacity,
    amenities: rt.amenities ?? [],
    image: getImageUrl(imageUrl),
    imageUrl,
    images,
    unitCount,
  };
}

/**
 * Guests browse room TYPES (one card per category).
 * Physical rooms are inventory assigned when checking availability / booking.
 */
export function buildPublicRoomCatalog(types: DbRoomType[], rooms: DbRoom[]): PublicRoomType[] {
  const bookable = rooms.filter((r) => r.status !== "MAINTENANCE");
  const catalog = types.map((rt) => mapRoomType(rt, bookable));

  // Bestseller = the type with the most real photos (never a blank/stock card).
  let bestsellerId: string | null = null;
  let bestCount = 0;
  for (const item of catalog) {
    if (item.images.length > bestCount) {
      bestCount = item.images.length;
      bestsellerId = item.id;
    }
  }
  if (bestCount === 0) bestsellerId = null;

  return catalog.map((item) => ({
    ...item,
    isBestseller: bestsellerId != null && item.id === bestsellerId,
  }));
}

export function mapRoom(r: DbRoom) {
  // Physical rooms keep their own gallery only — never inherit type marketing photos.
  const images = imagesFromSource(r);
  const rawImage = coverFromImages(images);
  return {
    id: r.id,
    roomNumber: r.room_number,
    roomTypeId: r.room_type_id,
    status: r.status,
    image: getImageUrl(rawImage),
    imageUrl: rawImage,
    images,
    roomType: r.room_type ? mapRoomType(r.room_type) : undefined,
  };
}

function invalidateCatalog(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.roomTypes });
  qc.invalidateQueries({ queryKey: queryKeys.rooms });
}

export function useRoomTypes() {
  return useQuery({
    queryKey: queryKeys.roomTypes,
    queryFn: async () => {
      const [types, rooms] = await Promise.all([
        roomTypesService.fetchRoomTypes(),
        roomsService.fetchRooms(),
      ]);
      return buildPublicRoomCatalog(types, rooms);
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

/** Raw room type records — for admin forms, search, and booking metadata. */
export function useRoomTypeRecords() {
  return useQuery({
    queryKey: [...queryKeys.roomTypes, "records"],
    queryFn: roomTypesService.fetchRoomTypes,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useRooms() {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: async () => {
      const data = await roomsService.fetchRooms();
      return data.map(mapRoom);
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useGuests() {
  return useQuery({
    queryKey: queryKeys.guests,
    queryFn: guestsService.fetchGuests,
  });
}

export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: bookingsService.fetchBookings,
  });
}

export function usePayments() {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: paymentsService.fetchPayments,
  });
}

export function useHotelSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsService.fetchHotelSettings,
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profiles,
    queryFn: profilesService.fetchAllProfiles,
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingsService.updateBookingStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings });
      qc.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingsService.createBooking,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bookings }),
  });
}

export function useCreateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Guest, "id" | "created_at" | "is_active">) => guestsService.createGuest(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.guests }),
  });
}

export function useUpdateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Guest, "id" | "created_at">> }) =>
      guestsService.updateGuest(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.guests }),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      booking_id: string;
      amount: number;
      method: PaymentMethod;
      status: PaymentStatus;
      reference_number?: string | null;
      payment_date?: string;
      notes?: string | null;
    }) => paymentsService.createPayment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payments }),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomsService.createRoom,
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof roomsService.updateRoom>[1] }) =>
      roomsService.updateRoom(id, patch),
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomsService.deleteRoom,
    onSuccess: () => {
      invalidateCatalog(qc);
      qc.invalidateQueries({ queryKey: queryKeys.bookings });
      qc.invalidateQueries({ queryKey: queryKeys.payments });
    },
  });
}

export function useCreateRoomType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomTypesService.createRoomType,
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useUpdateRoomType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<DbRoomType, "id" | "created_at">> }) =>
      roomTypesService.updateRoomType(id, patch),
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useDeleteRoomType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomTypesService.deleteRoomType,
    onSuccess: () => {
      invalidateCatalog(qc);
      qc.invalidateQueries({ queryKey: queryKeys.bookings });
      qc.invalidateQueries({ queryKey: queryKeys.payments });
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof settingsService.updateHotelSettings>[1] }) =>
      settingsService.updateHotelSettings(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof profilesService.updateProfile>[1] }) =>
      profilesService.updateProfile(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profiles }),
  });
}

export async function checkRoomAvailability(
  roomId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string,
) {
  return bookingsService.isRoomAvailable(roomId, checkIn, checkOut, excludeBookingId);
}

export async function submitPublicBooking(input: {
  guest: Omit<Guest, "id" | "created_at" | "is_active">;
  room_id: string;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  total_amount: number;
  special_requests?: string;
}) {
  let guest = await guestsService.findGuestByEmail(input.guest.email);
  if (!guest) {
    guest = await guestsService.createGuest(input.guest);
  }
  return bookingsService.createBooking({
    guest_id: guest.id,
    room_id: input.room_id,
    check_in: input.check_in,
    check_out: input.check_out,
    number_of_guests: input.number_of_guests,
    total_amount: input.total_amount,
    special_requests: input.special_requests ?? null,
    status: "PENDING",
  });
}

export async function lookupBooking(reference: string) {
  return bookingsService.fetchBookingByReference(reference);
}

export function useActiveStories() {
  return useQuery({
    queryKey: [...queryKeys.stories, "active"] as const,
    queryFn: storiesService.fetchActiveStories,
    staleTime: 30_000,
    retry: false,
  });
}

export function useAllStories() {
  return useQuery({
    queryKey: [...queryKeys.stories, "all"] as const,
    queryFn: storiesService.fetchAllStories,
    retry: false,
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storiesService.createStory,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.stories }),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storiesService.deleteStory,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.stories }),
  });
}

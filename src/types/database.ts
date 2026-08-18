export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "RECEPTIONIST"
  | "HOUSEKEEPING"
  | "STAFF"
  | "PENDING_STAFF"
  | "GUEST";

export type ProfileStatus = "ACTIVE" | "DISABLED" | "PENDING";

/** @deprecated Use UserRole */
export type StaffRole = "ADMIN" | "STAFF";
/** @deprecated Use ProfileStatus */
export type StaffStatus = "ACTIVE" | "DISABLED";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
export type PaymentMethod = "Cash" | "Invoice" | "Stripe" | "Mobile Money";
export type PaymentStatus = "PAID" | "PENDING" | "PARTIAL" | "REFUNDED" | "UNPAID";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: ProfileStatus;
  position: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

export type HotelSettings = {
  id: string;
  hotel_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  tax_rate: number;
  check_in_time: string;
  check_out_time: string;
  languages: string[];
  updated_at: string;
};

export type RoomType = {
  id: string;
  name: string;
  name_so: string;
  description: string;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  /** Cover image (first of image_urls). */
  image_url: string | null;
  /** Gallery photos; first entry is the cover. */
  image_urls: string[];
  created_at: string;
};

export type Room = {
  id: string;
  room_number: string;
  room_type_id: string;
  status: RoomStatus;
  /** Cover image (first of image_urls). */
  image_url: string | null;
  /** Gallery photos; first entry is the cover. */
  image_urls: string[];
  created_at: string;
  room_type?: RoomType;
};

export type Guest = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  is_active: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  reference: string;
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  total_amount: number;
  status: BookingStatus;
  special_requests: string | null;
  created_at: string;
  guest?: Guest;
  room?: Room;
};

export type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference_number: string | null;
  payment_date: string;
  notes: string | null;
  created_at: string;
  booking?: Booking;
};

export type StaffUser = {
  id: string;
  profile_id: string;
  employee_code: string | null;
  department: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactMessageStatus = "NEW" | "READ" | "REPLIED" | "ARCHIVED";

export type ContactMessage = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type StoryMediaType = "image" | "video";

export type Story = {
  id: string;
  author_id: string;
  author_name: string;
  author_title: string | null;
  author_photo: string | null;
  title: string | null;
  caption: string | null;
  media_type: StoryMediaType;
  media_url: string;
  thumbnail_url: string | null;
  duration_sec: number;
  is_active: boolean;
  created_at: string;
};

export type StoryGroup = {
  author_id: string;
  author_name: string;
  author_title: string | null;
  author_photo: string | null;
  stories: Story[];
};

export const HOTEL_STAFF_ROLES: UserRole[] = [
  "ADMIN",
  "MANAGER",
  "RECEPTIONIST",
  "HOUSEKEEPING",
  "STAFF",
];

export const ADMIN_ONLY_ROUTES = [
  "/admin/staff",
  "/admin/settings",
  "/admin/approve-staff",
] as const;

export const MANAGER_ROUTES = [
  "/admin/dashboard",
  "/admin/bookings",
  "/admin/rooms",
  "/admin/room-types",
  "/admin/guests",
  "/admin/payments",
  "/admin/reports",
  "/admin/stories",
] as const;

export const RECEPTIONIST_ROUTES = [
  "/admin/dashboard",
  "/admin/bookings",
  "/admin/guests",
  "/admin/stories",
] as const;

export const HOUSEKEEPING_ROUTES = ["/admin/dashboard", "/admin/rooms", "/admin/stories"] as const;

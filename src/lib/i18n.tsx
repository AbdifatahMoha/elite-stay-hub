import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "so";

type Dict = Record<string, { en: string; so: string }>;

export const translations: Dict = {
  // nav
  home: { en: "Home", so: "Bogga Hore" },
  rooms: { en: "Rooms", so: "Qolalka" },
  about: { en: "About", so: "Nagu Saabsan" },
  experience: { en: "Experience", so: "Khibradda" },
  offers: { en: "Offers", so: "Dalabyada" },
  checkBooking: { en: "Check Booking", so: "Hubi Qabashada" },
  booking: { en: "Booking", so: "Qabashada" },
  contact: { en: "Contact", so: "Nala Soo Xiriir" },
  staffLogin: { en: "Staff Login", so: "Soo Gal Shaqaalaha" },
  bookNow: { en: "Book Now", so: "Qabso Hadda" },
  checkAvailability: { en: "Check Availability", so: "Hubi Helitaanka" },
  availableRooms: { en: "Available Rooms", so: "Qolalka Bannaan" },
  checkIn: { en: "Check In", so: "Soo Gelid" },
  checkOut: { en: "Check Out", so: "Bixid" },
  guests: { en: "Guests", so: "Martida" },
  bookings: { en: "Bookings", so: "Qabashooyinka" },
  dashboard: { en: "Dashboard", so: "Dashboard" },
  payments: { en: "Payments", so: "Lacag-bixinnada" },
  reports: { en: "Reports", so: "Warbixinnada" },
  settings: { en: "Settings", so: "Dejinta" },
  confirm: { en: "Confirm", so: "Xaqiiji" },
  cancel: { en: "Cancel", so: "Jooji" },
  pending: { en: "Pending", so: "Sugaya" },
  confirmed: { en: "Confirmed", so: "La Xaqiijiyay" },
  cancelled: { en: "Cancelled", so: "La Joojiyay" },
  available: { en: "Available", so: "Bannaan" },
  occupied: { en: "Occupied", so: "La Deggan Yahay" },
  reserved: { en: "Reserved", so: "La Qabtay" },
  checkedIn: { en: "Checked In", so: "La Soo Galay" },
  checkedOut: { en: "Checked Out", so: "La Baxay" },
  maintenance: { en: "Maintenance", so: "Dayactirka" },
  // hero
  heroEyebrow: { en: "Mogadishu · Boutique Hotel", so: "Muqdisho · Hoteel Boutique" },
  heroHeadline: { en: "Welcome to EliteStay", so: "Heer Sare oo Joogitaan Kasta" },
  heroSub: {
    en: "Experience the pinnacle of boutique hospitality where timeless elegance meets modern precision.",
    so: "Ku raaxayso heerka ugu sarreeya ee martiqaadka boutique halkaas oo quruxda waqtiga la'aanta ah ay ku kulanto saxnaanta casriga ah.",
  },
  muteVideo: { en: "Mute intro", so: "Aamus horudhaca" },
  unmuteVideo: { en: "Unmute intro", so: "Fur codka horudhaca" },
  storiesEyebrow: { en: "Stories", so: "Sheekooyinka" },
  storiesTitle: { en: "EliteStay Stories", so: "Sheekooyinka EliteStay" },
  storiesNav: { en: "Stories", so: "Sheekooyinka" },
  callHotel: { en: "Call", so: "Wac" },
  bookRoom: { en: "Book a room", so: "Qabso qol" },
  footerTagline: {
    en: "EliteStay is a bilingual English and Somali web-based hotel management and room booking system for small-to-medium hotels.",
    so: "EliteStay waa nidaam maamul hoteel iyo qabasho qol oo ku salaysan webka oo laba luuqad ah (Ingiriisi & Soomaali) oo loogu talagalay hoteellada yaryar iyo kuwa dhexdhexaadka ah.",
  },
  experienceTitle: {
    en: "A refined stay, thoughtfully crafted.",
    so: "Joogitaan la hagaajiyay, si taxaddar leh loo sameeyay.",
  },
  experienceDesc: {
    en: "Every detail — from the linen on your bed to the coffee at sunrise — is chosen to elevate your visit. Whether for work, family, or quiet retreat, EliteStay is a residence you'll want to return to.",
    so: "Faahfaahin kasta — laga bilaabo sharabaadda sariirtaada ilaa qaxwada qorrax-soo-baxa — waxaa loo doortay in lagu kor u qaado booqashadaada.",
  },
  exploreAll: { en: "Explore all suites", so: "Baadh dhammaan qolalka" },
  ourCollection: { en: "Our Collection", so: "Ururinteenna" },
  curatedLivingSpaces: { en: "Curated Living Spaces", so: "Goobaha Nolosha ee La Xulay" },
  curatedDesc: {
    en: "Each room at EliteStay is a sanctuary of refined taste, featuring hand-selected materials and state-of-the-art amenities designed for the discerning traveler.",
    so: "Qol kasta oo EliteStay ah waa meel raaxo leh oo dhadhan la hagaajiyay, oo leh agab gacanta lagu doortay iyo adeegyo casri ah oo loogu talagalay safarkaaga.",
  },
  viewAllSuites: { en: "View All Suites", so: "Arag Dhammaan Qolalka" },
  bestseller: { en: "Bestseller", so: "Ugu Iibka Badan" },
  learnMore: { en: "Learn more", so: "Wax badan ka baro" },
  ctaDesc: {
    en: "Browse our collection of rooms and suites, then reserve your perfect stay in just a few clicks.",
    so: "Baadh ururinta qolalkeenna, ka dibna qabso joogitaankaaga ku habboon dhawr guji oo kaliya.",
  },
  searchRooms: { en: "Search Rooms", so: "Raadi Qolalka" },
  featuredRooms: { en: "Our Featured Rooms", so: "Qolalkeenna Ugu Fiican" },
  whyChoose: { en: "Why Choose EliteStay", so: "Waa Maxay Sababta Aad U Doorato EliteStay" },
  easyBooking: { en: "Easy Booking", so: "Qabasho Fudud" },
  easyBookingDesc: { en: "Book your ideal room in just a few clicks.", so: "Qabso qolkaaga ku habboon dhawr jaray oo kaliya." },
  realTimeAvail: { en: "Real-Time Availability", so: "Helitaan Wakhtiga-Dhabta Ah" },
  realTimeAvailDesc: { en: "Live room status prevents double bookings.", so: "Xaaladda qolka ee tooska ah waxay ka hortagtaa qabasho laba jibbaaran." },
  comfortableRooms: { en: "Comfortable Rooms", so: "Qolal Raaxo Leh" },
  comfortableRoomsDesc: { en: "Every room is designed with your comfort in mind.", so: "Qol kastaa waxaa loo naqshadeeyay raaxadaada." },
  professionalService: { en: "Professional Service", so: "Adeeg Xirfad Leh" },
  professionalServiceDesc: { en: "Our staff is here for you around the clock.", so: "Shaqaaladeenu adiga ayey kuu joogaan 24-saacba." },
  readyStay: { en: "Ready for your next stay?", so: "Ma diyaar u tahay joogitaankaaga xiga?" },
  findRoom: { en: "Find Your Room", so: "Hel Qolkaaga" },
  viewDetails: { en: "View Details", so: "Arag Faahfaahin" },
  numberOfGuests: { en: "Number of Guests", so: "Tirada Martida" },
  perNight: { en: "per night", so: "habeenkiiba" },
  amenities: { en: "Amenities", so: "Adeegyada" },
  // booking form
  guestInformation: { en: "Guest Information", so: "Macluumaadka Martida" },
  fullName: { en: "Full Name", so: "Magaca Buuxa" },
  email: { en: "Email Address", so: "Iimaylka" },
  phone: { en: "Phone Number", so: "Lambarka Taleefanka" },
  address: { en: "Address", so: "Cinwaanka" },
  nationality: { en: "Nationality", so: "Dhalashada" },
  specialRequests: { en: "Special Requests", so: "Codsiyo Gaar Ah" },
  stayDetails: { en: "Stay Details", so: "Faahfaahinta Joogitaanka" },
  bookingSummary: { en: "Booking Summary", so: "Kooban ee Qabashada" },
  totalAmount: { en: "Total Amount", so: "Wadarta Lacagta" },
  submitBooking: { en: "Submit Booking Request", so: "Gudbi Codsiga Qabashada" },
  paymentByStaff: { en: "Payment will be recorded by hotel staff.", so: "Lacagta waxaa diiwaangelin doona shaqaalaha hoteelka." },
  checkYourBooking: { en: "Check Your Booking Status", so: "Hubi Xaaladda Qabashadaada" },
  bookingReference: { en: "Booking Reference", so: "Tixraaca Qabashada" },
  checkStatus: { en: "Check Status", so: "Hubi Xaaladda" },
  nights: { en: "Nights", so: "Habeenno" },
  pricePerNight: { en: "Price per Night", so: "Qiimaha Habeenkiiba" },
  capacity: { en: "Capacity", so: "Awoodda" },
  status: { en: "Status", so: "Xaaladda" },
  actions: { en: "Actions", so: "Ficillo" },
  // admin
  totalBookings: { en: "Total Bookings", so: "Wadarta Qabashooyinka" },
  occupancyRate: { en: "Occupancy Rate", so: "Heerka Degganaanshaha" },
  totalRevenue: { en: "Total Revenue", so: "Wadarta Dakhliga" },
  pendingBookings: { en: "Pending Bookings", so: "Qabashooyin Sugaya" },
  recentBookings: { en: "Recent Bookings", so: "Qabashooyin Dhow" },
  quickActions: { en: "Quick Actions", so: "Ficillo Degdeg Ah" },
  arrivalsToday: { en: "Arrivals Today", so: "Imaanshaha Maanta" },
  departuresToday: { en: "Departures Today", so: "Bixitaanka Maanta" },
  newBookings: { en: "New Bookings", so: "Qabashooyin Cusub" },
  addBooking: { en: "Add Booking", so: "Ku Dar Qabasho" },
  addRoom: { en: "Add Room", so: "Ku Dar Qol" },
  recordPayment: { en: "Record Payment", so: "Diiwaangeli Lacag-bixin" },
  signIn: { en: "Sign In", so: "Soo Gal" },
  logout: { en: "Logout", so: "Ka Bax" },
  password: { en: "Password", so: "Furaha Sirta Ah" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string };
const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("elitestay_lang") as Lang | null;
    if (saved === "en" || saved === "so") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("elitestay_lang", l);
  };
  const t = (k: string) => translations[k]?.[lang] ?? k;
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
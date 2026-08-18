import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Users } from "lucide-react";
import { formatMoney } from "@/lib/formatters";
import type { PublicRoomType } from "@/hooks/use-hotel-data";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { HotelImage } from "@/components/ui/HotelImage";

type RoomCardProps = {
  room: PublicRoomType;
  index?: number;
  variant?: "curated" | "default";
  /** Prefer room.isBestseller; this override is optional. */
  badge?: "bestseller";
};

export function RoomCard({ room, index, variant = "default", badge }: RoomCardProps) {
  const { t, lang } = useI18n();
  const name = lang === "so" ? room.nameSo : room.name;
  const showBestseller = (badge === "bestseller" || room.isBestseller) && room.images.length > 0;
  const photoCount = room.images.length;

  if (variant === "curated") {
    return (
      <Link to="/rooms/$roomTypeId" params={{ roomTypeId: room.id }} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          <HotelImage
            src={room.imageUrl}
            alt={name}
            width={640}
            height={800}
            loading="lazy"
            className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
          />
          {showBestseller && (
            <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
              {t("bestseller")}
            </span>
          )}
          {photoCount > 1 && (
            <span className="absolute bottom-4 right-4 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
              {photoCount} photos
            </span>
          )}
        </div>
        <h3 className="mt-5 font-display text-xl font-semibold text-foreground transition-colors group-hover:text-primary md:text-2xl">
          {name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatMoney(room.pricePerNight)} {t("perNight")}
          {room.unitCount > 0 ? ` · ${room.unitCount} room${room.unitCount === 1 ? "" : "s"}` : ""}
        </p>
      </Link>
    );
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
      <Link to="/rooms/$roomTypeId" params={{ roomTypeId: room.id }} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
          <HotelImage
            src={room.imageUrl}
            alt={name}
            width={640}
            height={800}
            loading="lazy"
            className="h-full w-full transition-transform duration-700 group-hover:scale-105"
          />
          {typeof index === "number" && (
            <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
              {String(index + 1).padStart(2, "0")}
            </div>
          )}
          {showBestseller && (
            <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
              {t("bestseller")}
            </span>
          )}
          {photoCount > 1 && (
            <span className="absolute bottom-4 right-4 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
              {photoCount} photos
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold text-foreground">{name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatMoney(room.pricePerNight)} {t("perNight")}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {room.capacity}
            </span>
          </div>
        </div>
      </Link>
      <div className="border-t border-border px-5 pb-5">
        <Button asChild variant="ghost" className="w-full justify-between text-sm font-medium hover:bg-secondary">
          <Link to="/rooms/$roomTypeId" params={{ roomTypeId: room.id }}>
            {t("viewDetails")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

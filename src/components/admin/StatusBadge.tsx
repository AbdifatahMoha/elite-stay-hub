import { Badge } from "@/components/ui/badge";
import { statusBadgeClasses } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const KEY_MAP: Record<string, string> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  CHECKED_IN: "checkedIn",
  CHECKED_OUT: "checkedOut",
  AVAILABLE: "available",
  RESERVED: "reserved",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const key = KEY_MAP[status];
  const label = key ? t(key) : status;
  return (
    <Badge variant="outline" className={cn("border font-medium capitalize", statusBadgeClasses(status))}>
      {label}
    </Badge>
  );
}
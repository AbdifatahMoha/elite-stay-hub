export function formatMoney(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}

export function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export function statusBadgeClasses(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-warning/15 text-warning border-warning/30";
    case "CONFIRMED":
      return "bg-success/15 text-success border-success/30";
    case "CANCELLED":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "CHECKED_IN":
      return "bg-purple/15 text-purple border-purple/30";
    case "CHECKED_OUT":
      return "bg-muted text-muted-foreground border-border";
    case "AVAILABLE":
      return "bg-success/15 text-success border-success/30";
    case "RESERVED":
      return "bg-info/15 text-info border-info/30";
    case "OCCUPIED":
      return "bg-purple/15 text-purple border-purple/30";
    case "MAINTENANCE":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "PAID":
      return "bg-success/15 text-success border-success/30";
    case "PARTIAL":
      return "bg-warning/15 text-warning border-warning/30";
    case "UNPAID":
    case "REFUNDED":
      return "bg-destructive/15 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function generateBookingReference() {
  return `EST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LangSwitch({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { lang, setLang } = useI18n();
  const inactive = variant === "light" ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground";
  const active = variant === "light" ? "text-white font-semibold" : "text-foreground font-semibold";

  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <button onClick={() => setLang("en")} className={cn("transition-colors", lang === "en" ? active : inactive)}>
        EN
      </button>
      <span className={variant === "light" ? "text-white/40" : "text-border"}>|</span>
      <button onClick={() => setLang("so")} className={cn("transition-colors", lang === "so" ? active : inactive)}>
        SO
      </button>
    </div>
  );
}

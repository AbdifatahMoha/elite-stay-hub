import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { HeroIntro } from "@/components/public/HeroIntro";
import { StoriesRow } from "@/components/public/StoriesRow";
import { RoomCard } from "@/components/public/RoomCard";
import { useRoomTypes } from "@/hooks/use-hotel-data";
import { useI18n } from "@/lib/i18n";
import { ArrowUpRight, ArrowRight, CalendarCheck, Sparkles, BedDouble, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import exteriorImg from "@/assets/hotel-exterior.jpg";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { t } = useI18n();
  const { data: roomTypes = [] } = useRoomTypes();
  const features = [
    { icon: CalendarCheck, title: t("easyBooking"), desc: t("easyBookingDesc") },
    { icon: Sparkles, title: t("realTimeAvail"), desc: t("realTimeAvailDesc") },
    { icon: BedDouble, title: t("comfortableRooms"), desc: t("comfortableRoomsDesc") },
    { icon: Users, title: t("professionalService"), desc: t("professionalServiceDesc") },
  ];
  // Prefer types that have real photos; keep bestseller first when present.
  const featured = [...roomTypes]
    .sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller) || b.images.length - a.images.length)
    .slice(0, 3);

  return (
    <PublicLayout transparentHeader>
      <HeroIntro />

      <StoriesRow />

      {/* Curated rooms */}
      <section id="rooms" className="mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-10">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{t("ourCollection")}</span>
        <h2 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">
          {t("curatedLivingSpaces")}
        </h2>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl leading-relaxed text-muted-foreground">{t("curatedDesc")}</p>
          <Link
            to="/rooms"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:text-gold"
          >
            {t("viewAllSuites")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {featured.map((r) => (
            <RoomCard key={r.catalogKey} room={r} variant="curated" />
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="bg-secondary py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-10">
          <div className="overflow-hidden rounded-2xl shadow-lg">
            <img
              src={exteriorImg}
              alt="EliteStay exterior"
              width={800}
              height={600}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">{t("experience")}</span>
            <h2 className="mt-2 font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              {t("experienceTitle")}
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">{t("experienceDesc")}</p>
            <div className="mt-10 grid grid-cols-2 gap-6">
              {features.map((f) => (
                <div key={f.title} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <f.icon className="h-5 w-5 text-gold" />
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-gold"
            >
              {t("learnMore")} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10">
        <span className="text-sm font-semibold uppercase tracking-wider text-gold">{t("bookNow")}</span>
        <h2 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">{t("readyStay")}</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{t("ctaDesc")}</p>
        <Button asChild size="lg" className="mt-8 rounded-lg bg-gold px-10 text-gold-foreground hover:bg-gold/90">
          <Link to="/rooms">
            {t("findRoom")}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </PublicLayout>
  );
}

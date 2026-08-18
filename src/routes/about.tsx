import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import exteriorImg from "@/assets/hotel-exterior.jpg";
import { Award, HeartHandshake, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Experience — EliteStay" },
      {
        name: "description",
        content:
          "EliteStay is a bilingual English and Somali web-based hotel management and room booking system for small-to-medium hotels.",
      },
    ],
  }),
  component: About,
});

function About() {
  const { t } = useI18n();
  const values = [
    { icon: Award, title: "Excellence", desc: "Curated service in every interaction." },
    { icon: HeartHandshake, title: "Hospitality", desc: "Warm, personal, and multilingual care." },
    { icon: ShieldCheck, title: "Reliability", desc: "Real-time availability. No double bookings." },
  ];

  return (
    <PublicLayout>
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <span className="text-sm font-semibold uppercase tracking-wider text-gold">{t("experience")}</span>
          <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">{t("experienceTitle")}</h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/75">{t("experienceDesc")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <img
            src={exteriorImg}
            alt="EliteStay"
            className="aspect-[16/7] w-full object-cover"
            width={1600}
            height={700}
            loading="lazy"
          />
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-gold/15 text-gold">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

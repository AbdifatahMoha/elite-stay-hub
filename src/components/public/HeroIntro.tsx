import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { AvailabilityForm } from "@/components/public/AvailabilityForm";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Homepage intro clip: `public/intro.mp4` */
const HERO_VIDEO_SRC = "/intro.mp4";
const HERO_POSTER_SRC = "/back.jpg";

export function HeroIntro() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section || reduceMotion || videoFailed) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => setVideoFailed(true));
        else video.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [reduceMotion, videoFailed]);

  const showVideo = !reduceMotion && !videoFailed;

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-primary"
    >
      <img
        src={HERO_POSTER_SRC}
        alt="EliteStay"
        width={1920}
        height={1080}
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          videoReady ? "opacity-0" : "opacity-100",
          !videoReady && !reduceMotion && "hero-kenburns",
        )}
      />

      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="auto"
          poster={HERO_POSTER_SRC}
          disablePictureInPicture
          onPlaying={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      <div className="pointer-events-none absolute inset-0 bg-black/20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pt-28 lg:px-10">
        <div className="flex flex-1 flex-col items-center justify-center pb-8 text-center">
          <p className="hero-fade-up text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">
            {t("heroEyebrow")}
          </p>
          <span className="hero-fade-up mt-5 h-px w-16 bg-gold/80" />
          <h1 className="hero-fade-up-delay mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.05] text-white md:text-6xl lg:text-7xl">
            {t("heroHeadline")}
          </h1>
          <p className="hero-fade-up-delay-2 mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            {t("heroSub")}
          </p>
        </div>

        <div className="hero-fade-up-delay-2 mx-auto w-full max-w-5xl pb-10 lg:pb-12">
          <AvailabilityForm variant="hero" />
        </div>
      </div>

      {showVideo && videoReady && (
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (videoRef.current) videoRef.current.muted = next;
          }}
          className="absolute right-6 top-24 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
          aria-label={muted ? t("unmuteVideo") : t("muteVideo")}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}
    </section>
  );
}

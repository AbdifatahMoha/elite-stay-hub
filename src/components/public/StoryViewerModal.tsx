import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Phone, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/getImageUrl";
import { storyTimeAgo } from "@/lib/storyUtils";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { StoryGroup } from "@/types/database";

function AuthorAvatar({ name, photo, className }: { name: string; photo: string | null; className?: string }) {
  const src = getImageUrl(photo);
  if (src) {
    return <img src={src} alt={name} className={cn("rounded-full object-cover", className)} />;
  }
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className={cn("grid place-items-center rounded-full bg-gold text-xs font-semibold text-gold-foreground", className)}>
      {initials}
    </div>
  );
}

export function StoryViewerModal({
  storyGroups,
  initialAuthorIndex,
  onClose,
  phone,
}: {
  storyGroups: StoryGroup[];
  initialAuthorIndex: number;
  onClose: () => void;
  phone?: string | null;
}) {
  const { t } = useI18n();
  const [authorIndex, setAuthorIndex] = useState(initialAuthorIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentGroup = storyGroups[authorIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const goNext = useCallback(() => {
    const group = storyGroups[authorIndex];
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      return;
    }
    if (authorIndex < storyGroups.length - 1) {
      setAuthorIndex((i) => i + 1);
      setStoryIndex(0);
      return;
    }
    onClose();
  }, [authorIndex, storyIndex, storyGroups, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      return;
    }
    if (authorIndex > 0) {
      const prev = storyGroups[authorIndex - 1];
      setAuthorIndex((i) => i - 1);
      setStoryIndex(Math.max(0, (prev?.stories.length ?? 1) - 1));
    }
  }, [authorIndex, storyIndex, storyGroups]);

  useEffect(() => {
    setProgress(0);
    setPlaybackDuration(null);
    clearTimer();
    if (!currentStory) return;

    const startProgress = (seconds: number) => {
      setPlaybackDuration(seconds);
      const durationMs = seconds * 1000;
      let elapsed = 0;
      clearTimer();
      timerRef.current = setInterval(() => {
        elapsed += 50;
        const next = Math.min((elapsed / durationMs) * 100, 100);
        setProgress(next);
        if (next >= 100) {
          clearTimer();
          goNext();
        }
      }, 50);
    };

    if (currentStory.media_type !== "video") {
      startProgress(Math.min(Math.max(currentStory.duration_sec || 15, 1), 30));
      return () => clearTimer();
    }

    const video = videoRef.current;
    if (!video) return;

    const onMeta = () => {
      const seconds = Math.min(video.duration || currentStory.duration_sec || 15, 30);
      void video.play().catch(() => {
        video.muted = true;
        void video.play().catch(() => undefined);
      });
      startProgress(seconds);
    };

    if (video.readyState >= 1) onMeta();
    else video.addEventListener("loadedmetadata", onMeta, { once: true });

    return () => {
      clearTimer();
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [authorIndex, storyIndex, currentStory, goNext]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  if (!currentStory || !currentGroup) return null;

  const atStart = authorIndex === 0 && storyIndex === 0;
  const atEnd = authorIndex >= storyGroups.length - 1 && storyIndex >= currentGroup.stories.length - 1;
  const tel = phone?.replace(/\s/g, "") || "";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-[420px] border-none bg-transparent p-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">{currentGroup.author_name}</DialogTitle>
        <div className="relative mx-auto aspect-[9/16] h-[min(800px,85vh)] w-full overflow-hidden rounded-[24px] bg-black shadow-2xl">
          <div className="absolute inset-x-0 top-0 z-50 p-2">
            <div className="mb-2 flex gap-1">
              {currentGroup.stories.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full bg-white"
                    style={{
                      width: idx < storyIndex ? "100%" : idx === storyIndex ? `${progress}%` : "0%",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <AuthorAvatar name={currentGroup.author_name} photo={currentGroup.author_photo} className="h-6 w-6 border border-white" />
                <span className="text-xs font-medium text-white">{currentGroup.author_name}</span>
                <span className="text-xs text-white/60">· {storyTimeAgo(currentStory.created_at)}</span>
              </div>
              {playbackDuration !== null && (
                <span className="rounded bg-black/50 px-2 py-0.5 text-xs text-white/80">{Math.round(playbackDuration)}s</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-50 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goPrev}
            disabled={atStart}
            className={cn(
              "absolute left-3 top-1/2 z-50 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-white backdrop-blur-sm",
              atStart ? "cursor-not-allowed bg-black/20 opacity-50" : "bg-black/50 hover:bg-black/70",
            )}
            aria-label="Previous story"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={atEnd}
            className={cn(
              "absolute right-3 top-1/2 z-50 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-white backdrop-blur-sm",
              atEnd ? "cursor-not-allowed bg-black/20 opacity-50" : "bg-black/50 hover:bg-black/70",
            )}
            aria-label="Next story"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="flex h-full w-full items-center justify-center overflow-hidden">
            {currentStory.media_type === "video" ? (
              <video
                key={currentStory.id}
                ref={videoRef}
                src={currentStory.media_url}
                className="h-full w-full object-cover"
                playsInline
                autoPlay
                poster={currentStory.thumbnail_url || undefined}
              />
            ) : (
              <img key={currentStory.id} src={currentStory.media_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <AuthorAvatar
                name={currentGroup.author_name}
                photo={currentGroup.author_photo}
                className="h-12 w-12 border-2 border-white"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-white md:text-base">{currentGroup.author_name}</h3>
                {currentGroup.author_title && (
                  <p className="truncate text-xs text-white/80 md:text-sm">{currentGroup.author_title}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tel && (
                <Button asChild size="sm" className="min-w-[100px] flex-1 bg-white text-black hover:bg-white/90">
                  <a href={`tel:${tel}`}>
                    <Phone className="mr-1.5 h-4 w-4" />
                    {t("callHotel")}
                  </a>
                </Button>
              )}
              <Button asChild size="sm" className="min-w-[100px] flex-1 bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/rooms" onClick={onClose}>
                  {t("bookRoom")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AuthorAvatar };

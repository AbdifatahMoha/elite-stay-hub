import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { AuthorAvatar, StoryViewerModal } from "@/components/public/StoryViewerModal";
import { getImageUrl } from "@/lib/getImageUrl";
import { groupStoriesByAuthor } from "@/lib/storyUtils";
import { useActiveStories, useHotelSettings } from "@/hooks/use-hotel-data";
import { useI18n } from "@/lib/i18n";
import type { Story } from "@/types/database";

function StoryCardMedia({ story, name }: { story: Story; name: string }) {
  const poster = getImageUrl(story.thumbnail_url) || getImageUrl(story.media_url);
  if (story.media_type === "video") {
    return (
      <>
        {story.thumbnail_url ? (
          <img src={poster} alt={name} className="h-full w-full object-cover" />
        ) : (
          <video
            src={story.media_url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
            <Play className="ml-0.5 h-6 w-6 fill-black text-black" />
          </div>
        </div>
      </>
    );
  }
  return <img src={poster} alt={name} className="h-full w-full object-cover" />;
}

export function StoriesRow() {
  const { t } = useI18n();
  const { data: stories = [], isLoading } = useActiveStories();
  const { data: settings } = useHotelSettings();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const groups = useMemo(() => groupStoriesByAuthor(stories), [stories]);

  if (isLoading || groups.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 pb-8 pt-16 lg:px-10">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{t("storiesEyebrow")}</span>
      <h2 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">{t("storiesTitle")}</h2>
      <div className="scrollbar-hide mt-8 flex gap-4 overflow-x-auto pb-4" style={{ scrollSnapType: "x mandatory" }}>
        {groups.map((group, index) => {
          const first = group.stories[0];
          if (!first) return null;
          return (
            <button
              key={group.author_id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className="relative flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="relative h-[280px] w-[170px] overflow-hidden rounded-2xl bg-muted shadow-lg transition hover:shadow-xl sm:h-[320px] sm:w-[190px] md:h-[360px] md:w-[210px]">
                <div className="absolute inset-0">
                  <StoryCardMedia story={first} name={group.author_name} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-gold via-gold/80 to-gold/60" />
                    <AuthorAvatar
                      name={group.author_name}
                      photo={group.author_photo}
                      className="relative h-10 w-10 border-2 border-background"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-white">{group.author_name}</p>
                    {group.author_title && <p className="truncate text-xs text-white/80">{group.author_title}</p>}
                  </div>
                </div>
                {first.media_type === "video" && (
                  <div className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-black/50">
                    <Play className="ml-px h-3.5 w-3.5 fill-white text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedIndex !== null && groups[selectedIndex] && (
        <StoryViewerModal
          storyGroups={groups}
          initialAuthorIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          phone={settings?.phone}
        />
      )}
    </section>
  );
}

import type { Story, StoryGroup } from "@/types/database";

/** Group stories by staff author — newest author first, newest clip first inside each group. */
export function groupStoriesByAuthor(stories: Story[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>();

  for (const story of stories) {
    const existing = map.get(story.author_id);
    if (!existing) {
      map.set(story.author_id, {
        author_id: story.author_id,
        author_name: story.author_name,
        author_title: story.author_title,
        author_photo: story.author_photo,
        stories: [story],
      });
    } else {
      existing.stories.push(story);
    }
  }

  const groups = Array.from(map.values());
  for (const group of groups) {
    group.stories.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  groups.sort((a, b) => {
    const aDate = a.stories[0]?.created_at ?? "";
    const bDate = b.stories[0]?.created_at ?? "";
    return bDate.localeCompare(aDate);
  });
  return groups;
}

export function storyTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? "s" : ""} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} month${diffMonth > 1 ? "s" : ""} ago`;
}

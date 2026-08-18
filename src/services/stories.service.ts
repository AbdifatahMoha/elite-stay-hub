import { getSupabase } from "@/lib/supabase";
import { fetchProfile } from "@/services/profiles.service";
import type { Story, StoryMediaType } from "@/types/database";

export const HOTEL_STORIES_BUCKET = "hotel-stories";

export type CreateStoryInput = {
  media_type: StoryMediaType;
  media_url?: string;
  thumbnail_url?: string | null;
  duration_sec?: number;
  title?: string | null;
  caption?: string | null;
  file?: File | null;
};

function uniqueObjectPath(folder: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "bin";
  return `${folder}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
}

export async function uploadStoryMedia(file: File, authorId: string) {
  const supabase = getSupabase();
  const path = uniqueObjectPath(`stories/${authorId}`, file);
  const { error } = await supabase.storage.from(HOTEL_STORIES_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(HOTEL_STORIES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function isMissingStoriesTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.code === "PGRST205" || /stories/i.test(error.message ?? "") && /does not exist/i.test(error.message ?? "");
}

export async function fetchActiveStories(): Promise<Story[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (isMissingStoriesTable(error)) return [];
    throw error;
  }
  return (data ?? []) as Story[];
}

export async function fetchAllStories(): Promise<Story[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    if (isMissingStoriesTable(error)) return [];
    throw error;
  }
  return (data ?? []) as Story[];
}

export async function createStory(input: CreateStoryInput): Promise<Story> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to add a story.");

  const profile = await fetchProfile(user.id);
  if (!profile) throw new Error("Staff profile not found.");

  let mediaType = input.media_type;
  let mediaUrl = input.media_url?.trim() ?? "";

  if (input.file) {
    mediaUrl = await uploadStoryMedia(input.file, user.id);
    mediaType = input.file.type.startsWith("video/") ? "video" : "image";
  }

  if (!mediaUrl) throw new Error("Upload a file or paste a media URL.");

  const duration = Math.min(30, Math.max(1, Number(input.duration_sec) || 15));

  const { data, error } = await supabase
    .from("stories")
    .insert({
      author_id: user.id,
      author_name: profile.full_name,
      author_title: profile.position || "EliteStay Staff",
      author_photo: profile.avatar_url,
      title: input.title?.trim() || null,
      caption: input.caption?.trim() || null,
      media_type: mediaType,
      media_url: mediaUrl,
      thumbnail_url: input.thumbnail_url?.trim() || null,
      duration_sec: duration,
      is_active: true,
    })
    .select()
    .single();
  if (error) {
    if (isMissingStoriesTable(error)) {
      throw new Error("Stories table is missing. Run npm run db:migrate (or paste supabase/migrations/007_stories.sql in Supabase SQL Editor).");
    }
    throw error;
  }
  return data as Story;
}

export async function deleteStory(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("stories").delete().eq("id", id);
  if (error) throw error;
}

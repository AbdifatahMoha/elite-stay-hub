import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStory } from "@/hooks/use-hotel-data";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import type { StoryMediaType } from "@/types/database";

const MAX_BYTES = 50 * 1024 * 1024;

export function StoryForm({ onCreated }: { onCreated?: () => void }) {
  const createStory = useCreateStory();
  const [mediaType, setMediaType] = useState<StoryMediaType>("video");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState(15);
  const [file, setFile] = useState<File | null>(null);

  function reset() {
    setMediaType("video");
    setTitle("");
    setCaption("");
    setMediaUrl("");
    setThumbnailUrl("");
    setDuration(15);
    setFile(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (file && file.size > MAX_BYTES) {
      toast.error("File must be 50 MB or smaller.");
      return;
    }
    if (!file && !mediaUrl.trim()) {
      toast.error("Upload a file or paste a URL.");
      return;
    }
    try {
      await createStory.mutateAsync({
        media_type: mediaType,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl || null,
        duration_sec: duration,
        title,
        caption,
        file,
      });
      toast.success("Story published");
      reset();
      onCreated?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not publish story"));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Media type</Label>
        <select
          value={mediaType}
          onChange={(e) => {
            setMediaType(e.target.value as StoryMediaType);
            setFile(null);
            setMediaUrl("");
            setThumbnailUrl("");
          }}
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="video">Video</option>
          <option value="image">Image</option>
        </select>
      </div>
      <div>
        <Label>Title (optional)</Label>
        <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Suite reveal" />
      </div>
      <div>
        <Label>Caption (optional)</Label>
        <Textarea className="mt-1.5" value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
      </div>
      <div>
        <Label>{mediaType === "video" ? "Video URL" : "Image URL"}</Label>
        <Input
          className="mt-1.5"
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder={mediaType === "video" ? "https://…/clip.mp4" : "https://…/photo.jpg"}
        />
      </div>
      <div className="text-center text-xs font-medium text-muted-foreground">or upload a file</div>
      <div>
        <Input
          type="file"
          accept={mediaType === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*"}
          onChange={(e) => {
            const next = e.target.files?.[0] ?? null;
            setFile(next);
            if (next) setMediaUrl("");
          }}
        />
        {file && (
          <p className="mt-1 text-xs text-muted-foreground">
            {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>
      {mediaType === "video" && (
        <div>
          <Label>Thumbnail URL (optional)</Label>
          <Input className="mt-1.5" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
        </div>
      )}
      <div>
        <Label>Duration (seconds, max 30)</Label>
        <Input
          className="mt-1.5"
          type="number"
          min={1}
          max={30}
          value={duration}
          onChange={(e) => setDuration(Math.min(30, Math.max(1, Number(e.target.value) || 15)))}
        />
      </div>
      <Button type="submit" disabled={createStory.isPending} className="bg-gold text-gold-foreground hover:bg-gold/90">
        {createStory.isPending ? "Publishing…" : "Publish story"}
      </Button>
    </form>
  );
}

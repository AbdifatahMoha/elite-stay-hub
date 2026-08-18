import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImageIcon, Plus, Trash2, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StoryForm } from "@/components/admin/StoryForm";
import { AuthorAvatar } from "@/components/public/StoryViewerModal";
import { useAllStories, useDeleteStory } from "@/hooks/use-hotel-data";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import type { Story } from "@/types/database";

export const Route = createFileRoute("/admin/stories")({ component: StoriesPage });

function StoriesPage() {
  const { data: stories = [], isLoading } = useAllStories();
  const deleteStory = useDeleteStory();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Story | null>(null);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteStory.mutateAsync(toDelete.id);
      toast.success("Story deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete story"));
    } finally {
      setToDelete(null);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">EliteStay Stories</h2>
          <p className="text-sm text-muted-foreground">Vertical clips shown on the homepage, just like FaithState stories.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Story
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading stories…</p>
      ) : stories.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No stories yet. Add the first one.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stories.map((story) => (
            <Card key={story.id} className="overflow-hidden">
              <div className="relative aspect-[9/16] bg-black">
                {story.media_type === "video" ? (
                  <video src={story.media_url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={story.thumbnail_url || story.media_url} alt="" className="h-full w-full object-cover" />
                )}
                <div className="absolute right-2 top-2 text-white">
                  {story.media_type === "video" ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                </div>
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <AuthorAvatar name={story.author_name} photo={story.author_photo} className="h-8 w-8" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{story.author_name}</p>
                    <p className="text-xs text-muted-foreground">{story.duration_sec}s</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={() => setToDelete(story)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Story</DialogTitle>
          </DialogHeader>
          <StoryForm onCreated={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>This removes the story from the homepage. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

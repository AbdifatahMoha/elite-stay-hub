import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoomTypes } from "@/services/room-types.service";
import {
  useCreateRoomType,
  useUpdateRoomType,
  useDeleteRoomType,
  useRooms,
  queryKeys,
} from "@/hooks/use-hotel-data";
import { formatMoney } from "@/lib/formatters";
import { getErrorMessage } from "@/lib/errors";
import { collectImageUrls } from "@/lib/roomImages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { HotelImage } from "@/components/ui/HotelImage";
import {
  ImageMultiUpload,
  galleryFromUrls,
  mergeUploadedGallery,
  splitGallery,
  type ImageMultiUploadValue,
} from "@/components/admin/ImageMultiUpload";
import * as roomTypesService from "@/services/room-types.service";
import * as roomsService from "@/services/rooms.service";
import type { RoomType } from "@/types/database";

export const Route = createFileRoute("/admin/room-types")({ component: RoomTypesPage });

function RoomTypesPage() {
  const { data: roomTypes = [], isLoading } = useQuery({ queryKey: queryKeys.roomTypes, queryFn: fetchRoomTypes });
  const { data: rooms = [] } = useRooms();
  const createType = useCreateRoomType();
  const updateType = useUpdateRoomType();
  const deleteType = useDeleteRoomType();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = editId ? roomTypes.find((r) => r.id === editId) : null;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading room types…</p>;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Room Types</h2>
          <p className="text-sm text-muted-foreground">
            What guests browse and book (e.g. Deluxe, Single). Upload the marketing photos here.
          </p>
        </div>
        <Button onClick={() => { setEditId(null); setOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Room Type
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roomTypes.map((rt) => {
          const gallery = collectImageUrls(rt.image_urls, rt.image_url);
          const unitCount = rooms.filter((r) => r.roomTypeId === rt.id).length;
          return (
            <Card key={rt.id} className="overflow-hidden">
              <HotelImage src={rt.image_url} alt={rt.name} className="aspect-video w-full" />
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold">{rt.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(Number(rt.price_per_night))} · {rt.capacity} guests
                  {gallery.length > 0 ? ` · ${gallery.length} photo${gallery.length === 1 ? "" : "s"}` : ""}
                  {unitCount > 0 ? ` · ${unitCount} room${unitCount === 1 ? "" : "s"}` : ""}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{rt.description}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditId(rt.id); setOpen(true); }}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const message =
                        unitCount > 0
                          ? `Delete “${rt.name}”? This will also permanently delete its ${unitCount} room${unitCount === 1 ? "" : "s"} and any bookings on those rooms.`
                          : `Delete room type “${rt.name}”?`;
                      if (!confirm(message)) return;
                      try {
                        await deleteType.mutateAsync(rt.id);
                        toast.success(
                          unitCount > 0
                            ? `Room type deleted (and ${unitCount} room${unitCount === 1 ? "" : "s"})`
                            : "Room type deleted",
                        );
                      } catch (e) {
                        toast.error(getErrorMessage(e, "Delete failed"));
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Room Type" : "Add Room Type"}</DialogTitle>
          </DialogHeader>
          <RoomTypeForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            saving={saving}
            onSubmit={async (values, gallery) => {
              setSaving(true);
              try {
                const { files } = splitGallery(gallery);
                if (editing) {
                  const removed = collectImageUrls(editing.image_urls, editing.image_url).filter(
                    (url) => !gallery.items.some((item) => item.kind === "url" && item.url === url),
                  );
                  const uploaded = files.length
                    ? await roomTypesService.uploadRoomTypeImages(files, editing.id)
                    : [];
                  const image_urls = mergeUploadedGallery(gallery, uploaded);
                  await updateType.mutateAsync({ id: editing.id, patch: { ...values, image_urls } });
                  await Promise.all(removed.map((url) => roomsService.removeStoredImage(url)));
                  toast.success("Room type updated");
                } else {
                  const created = await createType.mutateAsync(values);
                  if (files.length) {
                    const uploaded = await roomTypesService.uploadRoomTypeImages(files, created.id);
                    const image_urls = mergeUploadedGallery(gallery, uploaded);
                    await updateType.mutateAsync({ id: created.id, patch: { image_urls } });
                  }
                  toast.success("Room type created");
                }
                setOpen(false);
              } catch (e) {
                toast.error(getErrorMessage(e, "Save failed"));
              } finally {
                setSaving(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoomTypeForm({
  initial,
  saving,
  onSubmit,
}: {
  initial?: RoomType;
  saving?: boolean;
  onSubmit: (
    values: Omit<RoomType, "id" | "created_at" | "image_url" | "image_urls">,
    gallery: ImageMultiUploadValue,
  ) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameSo, setNameSo] = useState(initial?.name_so ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price_per_night ?? 89));
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 2));
  const [amenities, setAmenities] = useState((initial?.amenities ?? []).join(", "));
  const [gallery, setGallery] = useState<ImageMultiUploadValue>(() =>
    galleryFromUrls(collectImageUrls(initial?.image_urls, initial?.image_url)),
  );

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(
          {
            name,
            name_so: nameSo,
            description,
            price_per_night: Number(price),
            capacity: Number(capacity),
            amenities: amenities.split(",").map((a) => a.trim()).filter(Boolean),
          },
          gallery,
        );
      }}
    >
      <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div><Label>Somali Name</Label><Input value={nameSo} onChange={(e) => setNameSo(e.target.value)} /></div>
      <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Price / night</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        <div><Label>Capacity</Label><Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
      </div>
      <div><Label>Amenities (comma-separated)</Label><Input value={amenities} onChange={(e) => setAmenities(e.target.value)} /></div>
      <ImageMultiUpload value={gallery} onChange={setGallery} disabled={saving} />
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

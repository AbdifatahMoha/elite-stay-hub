import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useRooms, useRoomTypeRecords, useCreateRoom, useUpdateRoom, useDeleteRoom } from "@/hooks/use-hotel-data";
import { formatMoney } from "@/lib/formatters";
import { getErrorMessage } from "@/lib/errors";
import { collectImageUrls } from "@/lib/roomImages";
import type { RoomStatus } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import * as roomsService from "@/services/rooms.service";

export const Route = createFileRoute("/admin/rooms")({ component: RoomsAdminPage });

function RoomsAdminPage() {
  const { data: rooms = [], isLoading } = useRooms();
  const { data: roomTypes = [] } = useRoomTypeRecords();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const [openAdd, setOpenAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = editId ? rooms.find((r) => r.id === editId) : null;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading rooms…</p>;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Room Management</h2>
          <p className="text-sm text-muted-foreground">
            Physical inventory (Room #101, #102…). Guests do not pick a number — the system assigns one when they book.
          </p>
        </div>
        <Button
          onClick={() => {
            if (!roomTypes.length) {
              toast.error("Create a room type first, then add rooms under it.");
              return;
            }
            setOpenAdd(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {!roomTypes.length && (
        <p className="mb-4 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          Rooms must belong to a room type. Go to <strong>Room Types</strong> and create one before adding rooms.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map((r) => {
          const dbType = roomTypes.find((t) => t.id === r.roomTypeId);
          const typeMeta = dbType
            ? {
                name: dbType.name,
                pricePerNight: Number(dbType.price_per_night),
                capacity: dbType.capacity,
                amenities: dbType.amenities ?? [],
              }
            : r.roomType
              ? {
                  name: r.roomType.name,
                  pricePerNight: r.roomType.pricePerNight,
                  capacity: r.roomType.capacity,
                  amenities: r.roomType.amenities ?? [],
                }
              : null;
          const photoCount = r.images?.length ?? 0;
          return (
            <Card key={r.id} className="overflow-hidden">
              <HotelImage
                src={r.imageUrl}
                alt={`Room ${r.roomNumber}`}
                className="aspect-video w-full"
              />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-lg font-semibold">Room #{r.roomNumber}</div>
                    <div className="text-xs text-muted-foreground">{typeMeta?.name ?? "No room type"}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {typeMeta && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>{formatMoney(typeMeta.pricePerNight)}</span>
                    <span className="text-muted-foreground">
                      {typeMeta.capacity} guests
                      {photoCount > 0 ? ` · ${photoCount} photo${photoCount === 1 ? "" : "s"}` : ""}
                    </span>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1">
                  {typeMeta?.amenities.slice(0, 4).map((a) => (
                    <Badge key={a} variant="secondary" className="text-[10px]">
                      {a}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Select
                    value={r.status}
                    onValueChange={async (v) => {
                      try {
                        await updateRoom.mutateAsync({ id: r.id, patch: { status: v as RoomStatus } });
                        toast.success("Room status updated");
                      } catch (e) {
                        toast.error(getErrorMessage(e, "Update failed"));
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 min-w-[8rem] flex-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="RESERVED">Reserved</SelectItem>
                      <SelectItem value="OCCUPIED">Occupied</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setEditId(r.id)}>
                    Photos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (
                        !confirm(
                          `Delete Room #${r.roomNumber}? Any bookings for this room will also be removed.`,
                        )
                      ) {
                        return;
                      }
                      try {
                        await deleteRoom.mutateAsync(r.id);
                        toast.success("Room deleted");
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

      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
          </DialogHeader>
          <AddRoomForm
            roomTypes={roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))}
            saving={saving}
            onSubmit={async (data, gallery) => {
              setSaving(true);
              try {
                const room = await createRoom.mutateAsync(data);
                const { files } = splitGallery(gallery);
                if (files.length) {
                  const uploaded = await roomsService.uploadRoomImages(files, room.id);
                  const image_urls = mergeUploadedGallery(gallery, uploaded);
                  await updateRoom.mutateAsync({ id: room.id, patch: { image_urls } });
                }
                setOpenAdd(false);
                toast.success("Room created");
              } catch (e) {
                toast.error(getErrorMessage(e, "Create failed"));
              } finally {
                setSaving(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Room #{editing?.roomNumber} photos</DialogTitle>
          </DialogHeader>
          {editing && (
            <EditRoomPhotosForm
              key={editing.id}
              initialUrls={editing.images ?? collectImageUrls(editing.imageUrl)}
              saving={saving}
              onSubmit={async (gallery) => {
                setSaving(true);
                try {
                  const previous = editing.images ?? collectImageUrls(editing.imageUrl);
                  const removed = previous.filter(
                    (url) => !gallery.items.some((item) => item.kind === "url" && item.url === url),
                  );
                  const { files } = splitGallery(gallery);
                  const uploaded = files.length
                    ? await roomsService.uploadRoomImages(files, editing.id)
                    : [];
                  const image_urls = mergeUploadedGallery(gallery, uploaded);
                  await updateRoom.mutateAsync({ id: editing.id, patch: { image_urls } });
                  await Promise.all(removed.map((url) => roomsService.removeStoredImage(url)));
                  setEditId(null);
                  toast.success("Room photos updated");
                } catch (e) {
                  toast.error(getErrorMessage(e, "Update failed"));
                } finally {
                  setSaving(false);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddRoomForm({
  roomTypes,
  saving,
  onSubmit,
}: {
  roomTypes: { id: string; name: string }[];
  saving?: boolean;
  onSubmit: (
    data: { room_number: string; room_type_id: string; status?: RoomStatus },
    gallery: ImageMultiUploadValue,
  ) => void;
}) {
  const [num, setNum] = useState("");
  const [typeId, setTypeId] = useState(roomTypes[0]?.id ?? "");
  const [gallery, setGallery] = useState<ImageMultiUploadValue>(() => galleryFromUrls());

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!num.trim()) return;
        if (!typeId) {
          toast.error("Select a room type. Every room must belong to a type.");
          return;
        }
        onSubmit({ room_number: num.trim(), room_type_id: typeId, status: "AVAILABLE" }, gallery);
      }}
    >
      <div>
        <Label>Room Number</Label>
        <Input value={num} onChange={(e) => setNum(e.target.value)} required />
      </div>
      <div>
        <Label>Room Type (required)</Label>
        <Select value={typeId} onValueChange={setTypeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent>
            {roomTypes.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ImageMultiUpload label="Photos (optional — this room only)" value={gallery} onChange={setGallery} disabled={saving} />
      <Button type="submit" className="w-full" disabled={saving || !roomTypes.length}>
        {saving ? "Creating…" : "Create Room"}
      </Button>
    </form>
  );
}

function EditRoomPhotosForm({
  initialUrls,
  saving,
  onSubmit,
}: {
  initialUrls: string[];
  saving?: boolean;
  onSubmit: (gallery: ImageMultiUploadValue) => void;
}) {
  const [gallery, setGallery] = useState<ImageMultiUploadValue>(() => galleryFromUrls(initialUrls));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(gallery);
      }}
    >
      <ImageMultiUpload value={gallery} onChange={setGallery} disabled={saving} />
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saving…" : "Save photos"}
      </Button>
    </form>
  );
}

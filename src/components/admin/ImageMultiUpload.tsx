import { useEffect, useRef } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HotelImage } from "@/components/ui/HotelImage";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 12;

export type GalleryItem =
  | { kind: "url"; url: string }
  | { kind: "file"; file: File; preview: string };

export type ImageMultiUploadValue = {
  items: GalleryItem[];
};

type ImageMultiUploadProps = {
  label?: string;
  value: ImageMultiUploadValue;
  onChange: (value: ImageMultiUploadValue) => void;
  disabled?: boolean;
  max?: number;
};

export function galleryFromUrls(urls: string[] = []): ImageMultiUploadValue {
  return { items: urls.filter(Boolean).map((url) => ({ kind: "url", url })) };
}

/** Split gallery into kept URLs + new files, preserving display order. */
export function splitGallery(value: ImageMultiUploadValue): { urls: string[]; files: File[] } {
  const urls: string[] = [];
  const files: File[] = [];
  for (const item of value.items) {
    if (item.kind === "url") urls.push(item.url);
    else files.push(item.file);
  }
  return { urls, files };
}

/** Merge newly uploaded URLs back into gallery order (files replaced left-to-right). */
export function mergeUploadedGallery(value: ImageMultiUploadValue, uploadedUrls: string[]): string[] {
  let i = 0;
  return value.items.map((item) => {
    if (item.kind === "url") return item.url;
    return uploadedUrls[i++] ?? "";
  }).filter(Boolean);
}

export function ImageMultiUpload({
  label = "Photos",
  value,
  onChange,
  disabled,
  max = MAX_IMAGES,
}: ImageMultiUploadProps) {
  const itemsRef = useRef(value.items);
  itemsRef.current = value.items;

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.kind === "file") URL.revokeObjectURL(item.preview);
      }
    };
  }, []);

  const remaining = Math.max(0, max - value.items.length);

  function addFiles(list: FileList | null) {
    if (!list?.length || remaining <= 0) return;
    const incoming = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining)
      .map((file) => ({ kind: "file" as const, file, preview: URL.createObjectURL(file) }));
    if (!incoming.length) return;
    onChange({ items: [...value.items, ...incoming] });
  }

  function removeAt(index: number) {
    const item = value.items[index];
    if (item?.kind === "file") URL.revokeObjectURL(item.preview);
    onChange({ items: value.items.filter((_, i) => i !== index) });
  }

  function setCover(index: number) {
    if (index <= 0) return;
    const next = [...value.items];
    const [picked] = next.splice(index, 1);
    onChange({ items: [picked, ...next] });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {value.items.length}/{max} · first is cover
        </span>
      </div>

      {value.items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.items.map((item, index) => {
            const src = item.kind === "url" ? item.url : item.preview;
            return (
              <div
                key={`${item.kind}-${index}-${item.kind === "url" ? item.url : item.file.name}`}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
                  index === 0 && "ring-2 ring-gold",
                )}
              >
                <HotelImage src={src} alt="" className="h-full w-full object-cover" />
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[9px] font-semibold uppercase text-gold-foreground">
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/55 to-transparent p-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      disabled={disabled}
                      title="Set as cover"
                      onClick={() => setCover(index)}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    disabled={disabled}
                    title="Remove"
                    onClick={() => removeAt(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {remaining > 0 ? (
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-6 text-center transition-colors hover:bg-secondary/70",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Add photos</span>
          <span className="text-xs text-muted-foreground">JPEG, PNG, WebP · up to {remaining} more</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <p className="text-xs text-muted-foreground">Maximum of {max} photos reached.</p>
      )}
    </div>
  );
}

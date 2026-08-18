import { handleImageError, resolveImageSrc } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";

type HotelImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
};

/** Room/property image. Missing/broken photos show a neutral empty state — never stock art. */
export function HotelImage({ src, className, alt = "", onError, ...props }: HotelImageProps) {
  const resolved = resolveImageSrc(src);

  if (!resolved) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted text-xs text-muted-foreground", className)}
        role="img"
        aria-label={alt || "No photo"}
      >
        No photo
      </div>
    );
  }

  return (
    <img
      {...props}
      src={resolved}
      alt={alt}
      className={cn("object-cover", className)}
      onError={(event) => {
        handleImageError(event);
        onError?.(event);
      }}
    />
  );
}

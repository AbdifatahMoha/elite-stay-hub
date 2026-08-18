import { useEffect, useState } from "react";
import { HotelImage } from "@/components/ui/HotelImage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type RoomImageGalleryProps = {
  images: string[];
  alt: string;
  className?: string;
};

export function RoomImageGallery({ images, alt, className }: RoomImageGalleryProps) {
  const slides = images.length > 0 ? images : [null];
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (slides.length === 1) {
    return (
      <div className={cn("overflow-hidden rounded-2xl bg-muted", className)}>
        <HotelImage
          src={slides[0]}
          alt={alt}
          className="aspect-[16/10] w-full"
          width={1200}
          height={750}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
        <div className="relative overflow-hidden rounded-2xl bg-muted">
          <CarouselContent className="-ml-0">
            {slides.map((src, index) => (
              <CarouselItem key={`${src ?? "placeholder"}-${index}`} className="pl-0">
                <HotelImage
                  src={src}
                  alt={`${alt} — photo ${index + 1}`}
                  className="aspect-[16/10] w-full"
                  width={1200}
                  height={750}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-3 top-1/2 h-9 w-9 -translate-y-1/2 border-0 bg-white/90 text-foreground shadow-sm hover:bg-white" />
          <CarouselNext className="right-3 top-1/2 h-9 w-9 -translate-y-1/2 border-0 bg-white/90 text-foreground shadow-sm hover:bg-white" />
          <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
            {current + 1} / {slides.length}
          </div>
        </div>
      </Carousel>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {slides.map((src, index) => (
          <button
            key={`thumb-${src ?? "placeholder"}-${index}`}
            type="button"
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition",
              current === index ? "border-gold" : "border-transparent opacity-80 hover:opacity-100",
            )}
            aria-label={`View photo ${index + 1}`}
          >
            <HotelImage src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

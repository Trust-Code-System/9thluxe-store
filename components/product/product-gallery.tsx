"use client";

import * as React from "react";

import Image from "next/image";

import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface ProductGalleryProps {
  images: string[];

  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}

      <Dialog>
        <DialogTrigger asChild>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted cursor-zoom-in group">
            <Image
              src={images[selectedIndex] || "/placeholder-flacon.svg"}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <VisuallyHidden.Root>
            <DialogTitle>{productName}</DialogTitle>

            <DialogDescription>
              Full-screen product image viewer
            </DialogDescription>
          </VisuallyHidden.Root>

          <div className="relative aspect-square">
            <Image
              src={images[selectedIndex] || "/placeholder-flacon.svg"}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />

            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />

              <span className="sr-only">Previous image</span>
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />

              <span className="sr-only">Next image</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnails */}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",

              index === selectedIndex
                ? "border-primary"
                : "border-transparent opacity-60 hover:opacity-100",
            )}
          >
            <Image
              src={image || "/placeholder-flacon.svg"}
              alt={`${productName} thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

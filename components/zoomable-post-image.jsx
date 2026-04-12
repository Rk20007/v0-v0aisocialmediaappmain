"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RotateCw, X } from "lucide-react"

export default function ZoomablePostImage({ src, alt = "Post", children }) {
  const [open, setOpen] = useState(false)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (!open) setRotation(0)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-black p-0 shadow-none duration-200 sm:max-w-none"
      >
        <DialogTitle className="sr-only">Full image view</DialogTitle>

        {/* FB-style top bar: close left, rotate right — no overlap with default X */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-white hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0 gap-1.5"
            onClick={() => setRotation((r) => (r + 90) % 360)}
          >
            <RotateCw className="h-4 w-4" />
            Rotate
          </Button>
        </div>

        {/* Scroll + padding so rotated image is not clipped */}
        <div className="flex min-h-0 flex-1 w-full items-center justify-center overflow-auto overscroll-contain px-[max(1rem,8vmin)] py-[max(1rem,8vmin)] pb-[max(1rem,calc(8vmin+env(safe-area-inset-bottom)))]">
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className="object-contain transition-transform duration-300 ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center center",
              maxHeight: "min(calc(100dvh - 3.75rem - 16vmin), calc(100vw - 16vmin))",
              maxWidth: "min(calc(100dvh - 3.75rem - 16vmin), calc(100vw - 16vmin))",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

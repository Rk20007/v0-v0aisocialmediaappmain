"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import {
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  Film,
  Plus,
  Upload,
  X,
  Play,
  Volume2,
  VolumeX,
  Camera,
  CheckCircle2,
  Bookmark,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function ReelsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialReelId = searchParams.get("id")
  const { data, isLoading, mutate } = useSWR("/api/reels", fetcher, {
    revalidateOnFocus: false,
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [caption, setCaption] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const scrollVelocityRef = useRef(0)
  const lastYRef = useRef(0)

  const reels = data?.reels || []

  useEffect(() => {
    if (initialReelId && reels.length > 0) {
      const index = reels.findIndex((r) => r._id === initialReelId)
      if (index >= 0) {
        setCurrentIndex(index)
      }
    }
  }, [initialReelId, reels.length])

  const [startX, setStartX] = useState(null)
  const [startY, setStartY] = useState(null)
  const router = useRouter()

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setStartX(touch.clientX)
    setStartY(touch.clientY)
  }

  const handleTouchEnd = (e) => {
    if (!startX || !startY) return

    const touch = e.changedTouches[0]
    const deltaX = startX - touch.clientX
    const deltaY = startY - touch.clientY

    // Priority: vertical scroll > horizontal back
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      // Vertical scroll
      if (deltaY > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => Math.min(prev + 1, reels.length - 1))
      } else if (deltaY < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => Math.max(prev - 1, 0))
      }
    } else if (deltaX > 100) {
      // Horizontal left swipe → back to feed
      router.back()
    }

    setStartX(null)
    setStartY(null)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => Math.min(prev + 1, reels.length - 1))
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex((prev) => Math.max(prev - 1, 0))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, reels.length])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast({ title: "Please select a video file", variant: "destructive" })
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        toast({ title: "Video must be under 100MB", variant: "destructive" })
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setUploadStatus("idle")
    }
  }

  const handleUploadReel = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      toast({ title: "Please select a video", variant: "destructive" })
      return
    }

    try {
      setUploadStatus("uploading")
      setUploadProgress(10)

      const formData = new FormData()
      formData.append("video", selectedFile)

      setUploadProgress(30)

      const uploadRes = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      setUploadProgress(60)

      const uploadData = await uploadRes.json()
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Failed to upload video")
      }

      setUploadStatus("processing")
      setUploadProgress(75)

      const res = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: uploadData.url,
          thumbnail: uploadData.thumbnail,
          caption,
        }),
        credentials: "include",
      })

      setUploadProgress(95)

      const reelData = await res.json()
      if (!reelData.success) {
        throw new Error(reelData.error || "Failed to create reel")
      }

      setUploadStatus("posted")
      setUploadProgress(100)

      toast({ title: "Reel posted successfully!" })

      setTimeout(() => {
        setSelectedFile(null)
        setPreviewUrl("")
        setCaption("")
        setUploadStatus("idle")
        setUploadProgress(0)
        setShowUpload(false)
        mutate()
      }, 2000)
    } catch (error) {
      setUploadStatus("error")
      toast({ title: error.message, variant: "destructive" })

      setTimeout(() => {
        setUploadStatus("idle")
      }, 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-gradient-to-b from-slate-950 to-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mb-4 mx-auto" />
          <p className="text-white/60">Loading reels...</p>
        </div>
      </div>
    )
  }

  if (showUpload) {
    return (
      <div className="p-4 min-h-[100dvh] bg-gradient-to-b from-slate-950 to-black pt-safe">
        <Card className="border-0 shadow-2xl max-w-lg mx-auto bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                <div className="p-2 bg-[#c9424a]/20 rounded-lg">
                  <Film className="h-5 w-5 text-[#c9424a]" />
                </div>
                Create New Reel
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (uploadStatus === "uploading" || uploadStatus === "processing") {
                    toast({
                      title: "Upload in progress",
                      description: "Please wait for the upload to complete",
                    })
                    return
                  }
                  setShowUpload(false)
                  setSelectedFile(null)
                  setPreviewUrl("")
                  setUploadStatus("idle")
                }}
                className="hover:bg-slate-700"
                disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
              >
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>

            <form onSubmit={handleUploadReel} className="space-y-5">
              <div
                onClick={() => !selectedFile && uploadStatus === "idle" && fileInputRef.current?.click()}
                className={cn(
                  "relative aspect-[9/16] max-h-[500px] rounded-2xl overflow-hidden border-2 border-dashed transition-all cursor-pointer",
                  selectedFile
                    ? "border-[#c9424a]/50 bg-black/40"
                    : "border-slate-600 bg-slate-900/40 hover:border-[#c9424a]/50",
                )}
              >
                {previewUrl ? (
                  <>
                    <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
                    {uploadStatus === "idle" && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-3 right-3 bg-[#c9424a] hover:bg-[#a0353b]"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                          setPreviewUrl("")
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}

                    {uploadStatus === "posted" && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <div className="text-center">
                          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-3 animate-bounce" />
                          <p className="text-white font-bold text-lg">Posted Successfully!</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <div className="p-4 rounded-full bg-[#c9424a]/10 mb-4">
                      <Camera className="h-12 w-12 text-[#c9424a]" />
                    </div>
                    <p className="font-semibold text-white">Tap to select video</p>
                    <p className="text-sm">MP4, WebM up to 100MB</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploadStatus !== "idle"}
              />

              <div>
                <label className="text-sm font-semibold mb-2 block text-white">Caption</label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption to your reel..."
                  rows={3}
                  maxLength={500}
                  disabled={uploadStatus !== "idle"}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none rounded-xl"
                />
                <p className="text-xs text-slate-400 mt-2 text-right">{caption.length}/500</p>
              </div>

              {(uploadStatus === "uploading" || uploadStatus === "processing" || uploadStatus === "posted") && (
                <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl">
                  <Progress value={uploadProgress} className="h-2 bg-slate-700" />
                  <div className="flex items-center justify-center gap-2">
                    {uploadStatus === "uploading" && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#c9424a]" />
                        <p className="text-sm text-slate-400">Uploading video...</p>
                      </>
                    )}
                    {uploadStatus === "processing" && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#c9424a]" />
                        <p className="text-sm text-slate-400">Processing reel...</p>
                      </>
                    )}
                    {uploadStatus === "posted" && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <p className="text-sm text-green-400 font-medium">Reel posted!</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-center text-slate-400">{uploadProgress}% complete</p>
                </div>
              )}

              {uploadStatus === "error" && (
                <Badge variant="destructive" className="w-full justify-center py-2 bg-red-900">
                  Upload failed. Please try again.
                </Badge>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-[#c9424a] hover:bg-[#a0353b] text-white"
                disabled={uploadStatus !== "idle" || !selectedFile}
                size="lg"
              >
                {uploadStatus === "uploading" || uploadStatus === "processing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {uploadStatus === "uploading" ? "Uploading..." : "Processing..."}
                  </>
                ) : uploadStatus === "posted" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Posted!
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Share Reel
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black p-4">
        <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-sm max-w-sm w-full">
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-full bg-white/10 w-fit mx-auto mb-4">
              <Film className="h-12 w-12 text-white" />
            </div>
            <p className="text-white font-bold text-lg mb-2">No reels yet</p>
            <p className="text-slate-400 text-sm mb-8">Be the first to share a reel!</p>
            <Button
              onClick={() => setShowUpload(true)}
              size="lg"
              className="gap-2 bg-[#c9424a] hover:bg-[#a0353b] text-white font-semibold"
            >
              <Plus className="h-5 w-5" />
              Create Reel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar: "Reels" label + Create button */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-6 pb-2">
        <span className="text-white text-xl font-bold drop-shadow-md tracking-tight">Reels</span>
        <Button
          onClick={() => setShowUpload(true)}
          size="icon"
          className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white border border-white/20"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Video Container */}
      <div
        className="h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {reels.map((reel, index) => (
          <div key={reel._id} className="h-full snap-start">
            <ReelCard reel={reel} isActive={index === currentIndex} currentUserId={user?._id} onMutate={mutate} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ReelCard({ reel, isActive, currentUserId, onMutate }) {
  const { toast } = useToast()
  const [liked, setLiked] = useState(reel.likes?.includes(currentUserId))
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0)
  const [bookmarked, setBookmarked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const [showPause, setShowPause] = useState(false)
  const videoRef = useRef(null)
  const lastTapRef = useRef(0)
  const pauseTimerRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.currentTime = 0
      videoRef.current.muted = isMuted
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isActive])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
      // Show pause icon briefly
      setShowPause(true)
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = setTimeout(() => setShowPause(false), 800)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTap = (e) => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      // Double tap → like
      if (!liked) {
        handleLike()
      }
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 900)
    } else {
      togglePlay()
    }
    lastTapRef.current = now
  }

  const handleLike = async () => {
    setLiked(!liked)
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1))
    try {
      await fetch(`/api/reels/${reel._id}/like`, { method: "POST", credentials: "include" })
    } catch {
      setLiked(liked)
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1))
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Reel by ${reel.user?.name}`, text: reel.caption || "Check out this reel!", url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({ title: "Link copied!" })
      }
    } catch { /* cancelled */ }
  }

  return (
    <div className="h-full relative bg-black select-none">
      {/* ── Full-screen video ── */}
      <div className="absolute inset-0" onClick={handleTap}>
        {reel.videoUrl ? (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
            poster={reel.thumbnail}
            preload="auto"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-black">
            <Film className="h-20 w-20 text-white/20" />
          </div>
        )}

        {/* Pause icon flash */}
        {showPause && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="p-5 rounded-full bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in-75 duration-150">
              <Play className="h-14 w-14 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Double-tap heart burst */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="h-32 w-32 fill-white text-white drop-shadow-2xl animate-in zoom-in-50 duration-200" />
          </div>
        )}
      </div>

      {/* ── Top gradient ── */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      {/* ── Bottom gradient ── */}
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* ── Mute / unmute (top-right, below progress bar area) ── */}
      <button
        onClick={toggleMute}
        className="absolute top-16 right-4 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-sm active:scale-90 transition-transform"
      >
        {isMuted
          ? <VolumeX className="h-5 w-5 text-white" />
          : <Volume2 className="h-5 w-5 text-white" />}
      </button>

      {/* ── Bottom overlay: user info + actions ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-8">
        <div className="flex items-end gap-2">

          {/* Left: user info + caption + music */}
          <div className="flex-1 min-w-0 space-y-2.5 pr-2">
            {/* Username row */}
            <div className="flex items-center gap-2.5">
              <Link href={`/user/${reel.userId}`}>
                <Avatar className="h-9 w-9 ring-2 ring-white shadow-lg">
                  <AvatarImage src={reel.user?.avatar || "/placeholder.svg"} alt={reel.user?.name} />
                  <AvatarFallback className="bg-[#c9424a] text-white text-sm font-bold">
                    {reel.user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Link href={`/user/${reel.userId}`}>
                <p className="font-bold text-white text-[15px] drop-shadow-md leading-tight">
                  {reel.user?.name}
                </p>
              </Link>
            </div>

            {/* Caption */}
            {reel.caption && (
              <p className="text-white/90 text-[13px] leading-snug line-clamp-2 drop-shadow font-medium">
                {reel.caption}
              </p>
            )}

            {/* Music row */}
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full bg-white/90 flex items-center justify-center shadow"
                style={{ animation: isPlaying ? "spin 3s linear infinite" : "none" }}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-black" />
              </div>
              <p className="text-white/80 text-[11px] font-medium truncate max-w-[150px]">
                ♪ Original audio · {reel.user?.name}
              </p>
            </div>
          </div>

          {/* Right: action buttons — clean Instagram style */}
          <div className="flex flex-col items-center gap-5 pb-2 shrink-0">
            {/* Like */}
            <button
              onClick={(e) => { e.stopPropagation(); handleLike() }}
              className="flex flex-col items-center gap-[3px] active:scale-90 transition-transform"
            >
              <Heart
                className={cn(
                  "h-8 w-8 drop-shadow-md transition-all duration-200",
                  liked
                    ? "fill-[#ff3b5c] text-[#ff3b5c] scale-110"
                    : "text-white fill-transparent stroke-white stroke-[1.8]"
                )}
              />
              <span className="text-white text-[11px] font-bold drop-shadow">{likesCount}</span>
            </button>

            {/* Comment */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center gap-[3px] active:scale-90 transition-transform"
            >
              <MessageCircle className="h-8 w-8 text-white fill-transparent stroke-white stroke-[1.8] drop-shadow-md" />
              <span className="text-white text-[11px] font-bold drop-shadow">{reel.comments?.length || 0}</span>
            </button>

            {/* Share — icon only, no text */}
            <button
              onClick={(e) => { e.stopPropagation(); handleShare() }}
              className="flex flex-col items-center gap-[3px] active:scale-90 transition-transform"
            >
              <Share2 className="h-8 w-8 text-white fill-transparent stroke-white stroke-[1.8] drop-shadow-md" />
            </button>

            {/* Save / Bookmark — icon only */}
            <button
              onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked) }}
              className="flex flex-col items-center gap-[3px] active:scale-90 transition-transform"
            >
              <Bookmark
                className={cn(
                  "h-8 w-8 drop-shadow-md transition-all duration-200",
                  bookmarked
                    ? "fill-white text-white scale-110"
                    : "text-white fill-transparent stroke-white stroke-[1.8]"
                )}
              />
            </button>

            {/* Spinning music disc */}
            <div
              className="h-10 w-10 rounded-full border-[3px] border-white/50 overflow-hidden shadow-lg"
              style={{ animation: isPlaying ? "spin 4s linear infinite" : "none" }}
            >
              {reel.user?.avatar ? (
                <img src={reel.user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#c9424a] to-[#e06b72] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{reel.user?.name?.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

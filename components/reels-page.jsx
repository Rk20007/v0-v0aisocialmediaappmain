"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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

  const handleTouchStart = (e) => {
    lastYRef.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY
    const diff = lastYRef.current - touchEndY
    scrollVelocityRef.current = diff

    if (Math.abs(diff) > 30) {
      if (diff > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => Math.min(prev + 1, reels.length - 1))
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => Math.max(prev - 1, 0))
      }
    }
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
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-gradient-to-b from-slate-950 to-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mb-4 mx-auto" />
          <p className="text-white/60">Loading reels...</p>
        </div>
      </div>
    )
  }

  if (showUpload) {
    return (
      <div className="p-4 min-h-[calc(100vh-8rem)] bg-gradient-to-b from-slate-950 to-black">
        <Card className="border-0 shadow-2xl max-w-lg mx-auto bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Film className="h-5 w-5 text-red-500" />
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
                    ? "border-red-500/50 bg-black/40"
                    : "border-slate-600 bg-slate-900/40 hover:border-red-500/50",
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
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600"
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
                    <div className="p-4 rounded-full bg-red-500/10 mb-4">
                      <Camera className="h-12 w-12 text-red-500" />
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
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                        <p className="text-sm text-slate-400">Uploading video...</p>
                      </>
                    )}
                    {uploadStatus === "processing" && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
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
                className="w-full h-12 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white"
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
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-gradient-to-b from-slate-950 to-black p-4">
        <Card className="border-0 shadow-2xl bg-slate-900/50 backdrop-blur-sm max-w-sm w-full border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="p-4 rounded-full bg-red-500/10 w-fit mx-auto mb-4">
              <Film className="h-16 w-16 text-red-500" />
            </div>
            <p className="text-white font-bold text-lg mb-2">No reels yet</p>
            <p className="text-slate-400 text-sm mb-8">Be the first to share a reel!</p>
            <Button
              onClick={() => setShowUpload(true)}
              size="lg"
              className="gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold"
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
      className="relative h-[calc(100vh-8rem)] bg-black overflow-hidden snap-y snap-mandatory"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header Progress Indicators */}
      <div className="absolute top-4 left-4 right-16 z-30 flex gap-1">
        {reels.slice(0, 10).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300 backdrop-blur-sm",
              i === currentIndex ? "bg-red-500" : "bg-white/20",
            )}
          />
        ))}
      </div>

      {/* Create Button */}
      <Button
        onClick={() => setShowUpload(true)}
        size="icon"
        className="absolute top-4 right-4 z-30 h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </Button>

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

      {/* Swipe Hint */}
      {currentIndex === 0 && reels.length > 1 && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 animate-bounce text-center">
          <p className="text-white/50 text-xs font-medium">Swipe up for more</p>
        </div>
      )}
    </div>
  )
}

function ReelCard({ reel, isActive, currentUserId, onMutate }) {
  const { toast } = useToast()
  const [liked, setLiked] = useState(reel.likes?.includes(currentUserId))
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0)
  const [bookmarked, setBookmarked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showHeart, setShowHeart] = useState(false)
  const videoRef = useRef(null)
  const lastTapRef = useRef(0)

  useEffect(() => {
    if (!videoRef.current) return

    if (isActive) {
      videoRef.current.currentTime = 0
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
      if (!liked) {
        handleLike()
        setShowHeart(true)
        setTimeout(() => setShowHeart(false), 600)
      }
    } else {
      togglePlay()
    }
    lastTapRef.current = now
  }

  const handleLike = async () => {
    setLiked(!liked)
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1))

    try {
      await fetch(`/api/reels/${reel._id}/like`, {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      setLiked(liked)
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1))
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Reel by ${reel.user?.name}`,
          text: reel.caption || "Check out this reel!",
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({ title: "Link copied to clipboard!" })
      }
    } catch (error) {
      // User cancelled share
    }
  }

  return (
    <div className="h-full relative bg-black group">
      {/* Video */}
      <div className="absolute inset-0" onClick={handleTap}>
        {reel.videoUrl ? (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            className="w-full h-full object-contain"
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

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none backdrop-blur-sm">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-md">
              <Play className="h-16 w-16 text-white fill-white" />
            </div>
          </div>
        )}

        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="h-28 w-28 text-red-500 fill-red-500 animate-ping" />
          </div>
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-20 right-4 z-20 p-3 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-all"
      >
        {isMuted ? <VolumeX className="h-6 w-6 text-white" /> : <Volume2 className="h-6 w-6 text-white" />}
      </button>

      {/* User Info & Actions */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
        <div className="flex items-end justify-between">
          {/* Left: User Info */}
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-12 w-12 border-2 border-white/30">
              <AvatarImage src={reel.user?.avatar || "/placeholder.svg"} alt={reel.user?.name} />
              <AvatarFallback className="bg-red-500/30 text-white">{reel.user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link href={`/profile/${reel.user?._id}`}>
                <p className="font-bold text-white hover:text-red-400 transition">{reel.user?.name}</p>
              </Link>
              {reel.caption && <p className="text-white/70 text-sm line-clamp-2">{reel.caption}</p>}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-col items-center gap-6 ml-4">
            <button onClick={handleLike} className="flex flex-col items-center gap-2 group">
              <div
                className={cn(
                  "p-3 rounded-full transition-all duration-200",
                  liked ? "bg-red-500/30 scale-110" : "bg-white/10 hover:bg-white/20",
                )}
              >
                <Heart className={cn("h-7 w-7 transition-all", liked ? "fill-red-500 text-red-500" : "text-white")} />
              </div>
              <span className="text-white text-xs font-semibold">{likesCount}</span>
            </button>

            <button className="flex flex-col items-center gap-2 group">
              <div className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                <MessageCircle className="h-7 w-7 text-white" />
              </div>
              <span className="text-white text-xs font-semibold">{reel.comments?.length || 0}</span>
            </button>

            <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
              <div className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                <Share2 className="h-7 w-7 text-white" />
              </div>
              <span className="text-white text-xs font-semibold">Share</span>
            </button>

            <button onClick={() => setBookmarked(!bookmarked)} className="flex flex-col items-center gap-2 group">
              <div
                className={cn(
                  "p-3 rounded-full transition-all",
                  bookmarked ? "bg-yellow-500/30" : "bg-white/10 hover:bg-white/20",
                )}
              >
                <Bookmark className={cn("h-7 w-7", bookmarked ? "fill-yellow-500 text-yellow-500" : "text-white")} />
              </div>
              <span className="text-white text-xs font-semibold">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

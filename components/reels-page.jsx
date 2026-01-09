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
  const [uploadStatus, setUploadStatus] = useState("idle") // 'idle' | 'uploading' | 'processing' | 'posted' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0)
  const [caption, setCaption] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const touchStartY = useRef(0)

  const reels = data?.reels || []

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
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
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (showUpload) {
    return (
      <div className="p-4 min-h-screen bg-background">
        <Card className="border-0 shadow-lg max-w-lg mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Film className="h-5 w-5 text-primary" />
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
                disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleUploadReel} className="space-y-4">
              <div
                onClick={() => !selectedFile && uploadStatus === "idle" && fileInputRef.current?.click()}
                className={cn(
                  "relative aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden border-2 border-dashed transition-all",
                  selectedFile ? "border-primary bg-black" : "border-muted-foreground/30 bg-muted/50",
                  uploadStatus === "idle" && !selectedFile && "cursor-pointer hover:border-primary/50",
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
                        className="absolute top-2 right-2"
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
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="text-center">
                          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-2 animate-bounce" />
                          <p className="text-white font-semibold">Posted Successfully!</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <div className="p-4 rounded-full bg-primary/10 mb-3">
                      <Camera className="h-10 w-10 text-primary" />
                    </div>
                    <p className="font-medium">Tap to select video</p>
                    <p className="text-sm text-muted-foreground">MP4, WebM up to 100MB</p>
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
                <label className="text-sm font-medium mb-2 block">Caption</label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your reel..."
                  rows={3}
                  maxLength={500}
                  disabled={uploadStatus !== "idle"}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{caption.length}/500</p>
              </div>

              {(uploadStatus === "uploading" || uploadStatus === "processing" || uploadStatus === "posted") && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="flex items-center justify-center gap-2">
                    {uploadStatus === "uploading" && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading video...</p>
                      </>
                    )}
                    {uploadStatus === "processing" && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Creating reel...</p>
                      </>
                    )}
                    {uploadStatus === "posted" && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Reel posted!</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-center text-muted-foreground">{uploadProgress}% complete</p>
                </div>
              )}

              {uploadStatus === "error" && (
                <Badge variant="destructive" className="w-full justify-center py-2">
                  Upload failed. Please try again.
                </Badge>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={
                  uploadStatus !== "idle" || !selectedFile || uploadStatus === "uploading" || uploadStatus === "posted"
                }
                size="lg"
              >
                {uploadStatus === "uploading" || uploadStatus === "processing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadStatus === "uploading" ? "Uploading..." : "Processing..."}
                  </>
                ) : uploadStatus === "posted" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Posted!
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
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
            <p className="text-white font-semibold mb-2">No reels yet</p>
            <p className="text-white/70 text-sm mb-6">Be the first to share a reel!</p>
            <Button onClick={() => setShowUpload(true)} size="lg" className="gap-2">
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
      className="relative h-screen bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Button
        onClick={() => setShowUpload(true)}
        size="icon"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 h-12 w-12 rounded-full bg-primary backdrop-blur-sm hover:bg-primary/90 border-2 border-white"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* <div className="absolute top-4 left-4 right-4 z-30 flex gap-1">
        {reels.slice(0, 10).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i === currentIndex ? "bg-white" : "bg-white/30",
            )}
          />
        ))}
      </div> */}

      <div
        className="h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {reels.map((reel, index) => (
          <div key={reel._id} className="h-full">
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
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          setIsPlaying(false)
        })
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
        setTimeout(() => setShowHeart(false), 1000)
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
        toast({ title: "Link copied!" })
      }
    } catch (error) {
      // User cancelled share
    }
  }

  return (
    <div className="h-full relative bg-black">
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
        ) : reel.thumbnail ? (
          <img src={reel.thumbnail || "/placeholder.svg"} alt="Reel" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="h-16 w-16 text-white/30" />
          </div>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="h-12 w-12 text-white fill-white" />
            </div>
          </div>
        )}

        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="h-24 w-24 text-white fill-white animate-ping" />
          </div>
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-16 right-4 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-sm"
      >
        {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
      </button>

      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "p-3 rounded-full transition-colors",
              liked ? "bg-red-500/20" : "bg-black/40 backdrop-blur-sm",
            )}
          >
            <Heart
              className={cn("h-7 w-7 transition-all", liked ? "fill-red-500 text-red-500 scale-110" : "text-white")}
            />
          </div>
          <span className="text-white text-xs font-medium">{likesCount}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
            <MessageCircle className="h-7 w-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{reel.comments?.length || 0}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
            <Share2 className="h-7 w-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </button>

        <Link href={`/user/${reel.userId}`}>
          <Avatar className="h-12 w-12 border-2 border-white ring-2 ring-primary">
            <AvatarImage src={reel.user?.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary text-white">{reel.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* User Info & Caption */}
      <div className="absolute left-4 right-20 bottom-8 z-20">
        <Link href={`/user/${reel.userId}`}>
          <p className="text-white font-bold text-base mb-1">@{reel.user?.name?.toLowerCase().replace(/\s/g, "")}</p>
        </Link>
        {reel.caption && <p className="text-white/90 text-sm line-clamp-2">{reel.caption}</p>}
      </div>
    </div>
  )
}

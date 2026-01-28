"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, X, ImageIcon, Video, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function StoriesBar() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showUpload, setShowUpload] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const [selectedUserStories, setSelectedUserStories] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [mediaType, setMediaType] = useState("")
  const [caption, setCaption] = useState("")
  const fileInputRef = useRef(null)

  const { data, mutate } = useSWR(user?._id ? `/api/stories?cache=${user._id}` : null, fetcher, {
    refreshInterval: 30000,
  })

  const stories = data?.stories || []
  const myStories = stories.find((s) => s.userId === user?._id)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: "File must be under 50MB", variant: "destructive" })
        return
      }

      const type = file.type.startsWith("video/") ? "video" : "image"
      setMediaType(type)
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUploadStory = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      toast({ title: "Please select an image or video", variant: "destructive" })
      return
    }

    setUploading(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append(mediaType === "video" ? "video" : "image", selectedFile)

      setUploadProgress(30)

      const endpoint = mediaType === "video" ? "/api/upload/video" : "/api/upload/image"
      const uploadRes = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      setUploadProgress(70)

      const uploadData = await uploadRes.json()
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Failed to upload media")
      }

      setUploadProgress(85)

      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: uploadData.url,
          mediaType,
          caption,
        }),
        credentials: "include",
      })

      setUploadProgress(100)

      const storyData = await res.json()
      if (storyData.success) {
        toast({ title: "Story uploaded successfully!" })
        setSelectedFile(null)
        setPreviewUrl("")
        setCaption("")
        setMediaType("")
        setShowUpload(false)
        mutate()
      } else {
        throw new Error(storyData.error || "Failed to create story")
      }
    } catch (error) {
      toast({ title: error.message, variant: "destructive" })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const openStoryViewer = (userStories) => {
    setSelectedUserStories(userStories)
    setShowViewer(true)
  }

  return (
    <>
      <div className="flex gap-3 px-4 py-3 overflow-x-auto hide-scrollbar border-b border-border">
        {/* Add Story Button */}
        <button onClick={() => setShowUpload(true)} className="flex-shrink-0 flex flex-col items-center gap-1.5">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-[#c9424a]">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#c9424a] text-white flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
          </div>
          <span className="text-xs font-medium">Your Story</span>
        </button>

        {/* Stories List */}
        {stories.map((userStory) => {
          const isOwn = userStory.userId === user?._id
          const allViewed = userStory.allViewed

          return (
            <button
              key={userStory.userId}
              onClick={() => openStoryViewer(userStory)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5"
            >
              <div
                className={cn(
                  "p-0.5 rounded-full",
                  isOwn ? "bg-muted" : allViewed ? "bg-muted" : "bg-gradient-to-tr from-[#c9424a] to-[#e06b72]",
                )}
              >
                <Avatar className="h-16 w-16 ring-2 ring-background">
                  <AvatarImage src={userStory.user?.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{userStory.user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs font-medium truncate w-16 text-center">{userStory.user?.name}</span>
            </button>
          )
        })}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-lg font-bold">Add Story</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowUpload(false)
                setSelectedFile(null)
                setPreviewUrl("")
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleUploadStory} className="space-y-4">
            {/* Media Preview/Select */}
            <div
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={cn(
                "relative aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden border-2 border-dashed cursor-pointer transition-colors",
                selectedFile
                  ? "border-[#c9424a] bg-black"
                  : "border-muted-foreground/30 bg-muted/50 hover:border-[#c9424a]/50",
              )}
            >
              {previewUrl ? (
                <>
                  {mediaType === "video" ? (
                    <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
                  ) : (
                    <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                  )}
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
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="flex gap-2 mb-3">
                    <div className="p-3 rounded-full bg-[#c9424a]/10">
                      <ImageIcon className="h-8 w-8 text-[#c9424a]" />
                    </div>
                    <div className="p-3 rounded-full bg-[#c9424a]/10">
                      <Video className="h-8 w-8 text-[#c9424a]" />
                    </div>
                  </div>
                  <p className="font-medium">Tap to select media</p>
                  <p className="text-sm text-muted-foreground">Image or video up to 50MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div>
              <label className="text-sm font-medium mb-2 block">Caption (Optional)</label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{caption.length}/200</p>
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProgress < 70 ? "Uploading..." : uploadProgress < 100 ? "Creating story..." : "Done!"}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={uploading || !selectedFile} size="lg">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Share Story
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Story Viewer */}
      {showViewer && selectedUserStories && (
        <StoryViewer userStories={selectedUserStories} onClose={() => setShowViewer(false)} mutate={mutate} />
      )}
    </>
  )
}

function StoryViewer({ userStories, onClose, mutate }) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnviewed = userStories.stories.findIndex((s) => !s.viewedByCurrentUser)
    return firstUnviewed >= 0 ? firstUnviewed : 0
  })
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const currentStory = userStories.stories[currentIndex]
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!currentStory || currentStory.viewedByCurrentUser) return

    fetch(`/api/stories/${currentStory._id}/view`, {
      method: "POST",
      credentials: "include",
    }).then(() => {
      mutate()
    })
  }, [currentStory, mutate])

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const duration = currentStory?.mediaType === "video" ? 15000 : 5000
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < userStories.stories.length - 1) {
            setCurrentIndex((i) => i + 1)
            return 0
          } else {
            onClose()
            return prev
          }
        }
        return prev + 100 / (duration / 100)
      })
    }, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentIndex, currentStory, onClose, userStories.stories.length, isPaused])

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const goToNext = () => {
    if (currentIndex < userStories.stories.length - 1) {
      setCurrentIndex((i) => i + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
        {userStories.stories.map((story, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                story.viewedByCurrentUser && i !== currentIndex ? "bg-white/60" : "bg-white",
              )}
              style={{
                width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 ring-2 ring-white">
            <AvatarImage src={userStories.user?.avatar || "/placeholder.svg"} />
            <AvatarFallback>{userStories.user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">{userStories.user?.name}</p>
            <p className="text-white/70 text-xs">
              {new Date(currentStory.createdAt).toLocaleDateString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Story Content */}
      <div className="h-full flex items-center justify-center">
        {currentStory.mediaType === "video" ? (
          <video
            key={currentStory._id}
            src={currentStory.mediaUrl}
            className="max-h-full max-w-full object-contain"
            autoPlay
            playsInline
          />
        ) : (
          <img
            key={currentStory._id}
            src={currentStory.mediaUrl || "/placeholder.svg"}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-8 left-0 right-0 z-20 px-4">
          <p className="text-white text-center text-sm">{currentStory.caption}</p>
        </div>
      )}

      {/* Navigation */}
      <button onClick={goToPrevious} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" />
      <button onClick={goToNext} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" />
    </div>
  )
}

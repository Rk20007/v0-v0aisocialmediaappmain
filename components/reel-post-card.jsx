"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ReelPostCard({ reel, currentUserId }) {
  const { toast } = useToast()
  const router = useRouter()
  // Strip the "reel-" prefix added by feed-page to get the real MongoDB _id
  const reelId = typeof reel._id === "string" && reel._id.startsWith("reel-")
    ? reel._id.slice(5)
    : reel._id
  const [liked, setLiked] = useState(reel.likes?.includes(currentUserId))
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState(reel.comments || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef(null)

  // Auto-play video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false))
    }
  }, [])

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

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      setComments((prev) => [...prev, { _id: Date.now(), content: comment, userName: "You" }])
      setComment("")
    } catch (error) {
      console.error("Failed to add comment")
    } finally {
      setIsSubmitting(false)
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

  const toggleMute = (e) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })

  return (
    <Card className="border-0 shadow-lg overflow-hidden animate-fade-in">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Link href={`/user/${reel.userId}`}>
          <Avatar className="h-10 w-10 border-2 border-[#c9424a]/20 cursor-pointer hover:border-[#c9424a] transition-colors">
            <AvatarImage src={reel.user?.avatar || "/placeholder.svg"} alt={reel.user?.name} />
            <AvatarFallback className="bg-[#c9424a]/10 text-[#c9424a] text-sm">
              {reel.user?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link href={`/user/${reel.userId}`} className="hover:underline">
            <p className="font-semibold text-sm">{reel.user?.name || "Anonymous"}</p>
          </Link>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>

        <div className="relative">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-xl z-50 overflow-hidden p-1">
                <button onClick={handleShare} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted rounded-lg transition-colors text-left">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  Share Reel
                </button>
              </div>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-2">
        {reel.caption && <p className="text-sm mb-3 whitespace-pre-wrap">{reel.caption}</p>}

        {/* Reel Video — tap to open full-screen reels page */}
        <div
          onClick={() => router.push(`/reels?id=${reelId}`)}
          className="relative rounded-xl overflow-hidden bg-muted aspect-square cursor-pointer group"
        >
          <video
            ref={videoRef}
            src={reel.videoUrl}
            className="w-full h-full object-cover"
            poster={reel.thumbnail}
            playsInline
            autoPlay
            loop
            muted={isMuted}
          />
          
          {/* Reel indicator badge */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded-full flex items-center gap-1">
            <svg className="h-3 w-3 text-white fill-current" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            <span className="text-white text-xs font-medium">Reel</span>
          </div>

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-all"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
          </button>

          {/* Play/Pause overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="h-14 w-14 rounded-full bg-white/80 flex items-center justify-center">
                <svg className="h-8 w-8 text-black fill-current" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col px-4 pt-0">
        <div className="flex items-center justify-between w-full py-2 border-t border-border">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="flex items-center gap-1.5 transition-all active:scale-95">
              <Heart
                className={cn(
                  "h-5 w-5 transition-all",
                  liked ? "fill-[#c9424a] text-[#c9424a] scale-110" : "text-muted-foreground",
                )}
              />
              <span className={cn("text-sm font-medium", liked && "text-[#c9424a]")}>{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{comments.length}</span>
            </button>
          </div>

          <button onClick={handleShare} className="text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {showComments && (
          <div className="w-full pt-2 space-y-3">
            {comments.slice(-3).map((c, i) => (
              <div key={c._id || i} className="flex gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={c.userAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{c.userName?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold">{c.userName}</p>
                  <p className="text-sm">{c.content}</p>
                </div>
              </div>
            ))}

            <form onSubmit={handleComment} className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 h-9 text-sm"
              />
              <Button type="submit" size="sm" disabled={!comment.trim() || isSubmitting} className="h-9 w-9 p-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

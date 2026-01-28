"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Download, Maximize2 } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
export default function PostCard({ post, currentUserId, onUpdate }) {
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUserId))
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState(post.comments || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showFullView, setShowFullView] = useState(false)

  const handleLike = async () => {
    setIsLiked(!isLiked)
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))

    try {
      await fetch(`/api/posts/${post._id}/like`, { method: "POST" })
    } catch (error) {
      setIsLiked(isLiked)
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1))
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${post._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      })

      const data = await res.json()
      if (data.success) {
        setComments((prev) => [...prev, data.comment])
        setComment("")
      }
    } catch (error) {
      console.error("Failed to add comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = async () => {
    setShowMenu(false)
    if (!post.imageUrl) return
    try {
      const response = await fetch(post.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `post-${post._id}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      window.open(post.imageUrl, '_blank')
    }
  }

  const handleShare = async () => {
    setShowMenu(false)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.user?.name}`,
          text: post.caption || 'Check out this post on Colorcode',
          url: window.location.href
        })
      } catch (err) {
        // Share cancelled
      }
    }
  }

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

  return (
    <Card className="border-0 shadow-lg overflow-hidden animate-fade-in">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Link href={`/user/${post.userId}`}>
          <Avatar className="h-10 w-10 border-2 border-[#c9424a]/20 cursor-pointer hover:border-[#c9424a] transition-colors">
            <AvatarImage src={post.user?.avatar || "/placeholder.svg"} alt={post.user?.name} />
            <AvatarFallback className="bg-[#c9424a]/10 text-[#c9424a] text-sm">
              {post.user?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link href={`/user/${post.userId}`} className="hover:underline">
            <p className="font-semibold text-sm">{post.user?.name || "Anonymous"}</p>
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
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-1">
                <button onClick={handleShare} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted rounded-lg transition-colors text-left">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  Share Post
                </button>
                <button onClick={handleDownload} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted rounded-lg transition-colors text-left">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  Download Image
                </button>
                <button onClick={() => {
                  setShowFullView(true)
                  setShowMenu(false)
                }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted rounded-lg transition-colors text-left">
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  Full View
                </button>
              </div>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-2">
        {post.caption && <p className="text-sm mb-3 whitespace-pre-wrap">{post.caption}</p>}

        {post.imageUrl && (
          <Dialog open={showFullView} onOpenChange={setShowFullView}>
            
              <div onClick={() => setShowFullView(true)} className="relative rounded-xl overflow-hidden bg-muted aspect-square cursor-pointer group">
                <img
                  src={post.imageUrl || "/placeholder.svg"}
                  alt="Post"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/90 border-none sm:max-w-fit focus:outline-none">
              <DialogTitle className="sr-only">View Post Image</DialogTitle>
              <div className="relative flex items-center justify-center h-full max-h-[70vh] w-full p-2">
                <img src={post.imageUrl || "/placeholder.svg"} alt="Post" className="max-h-[65vh] w-auto object-contain rounded-md" />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map((tag, i) => (
              <span key={i} className="text-xs text-[#c9424a] font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col px-4 pt-0">
        <div className="flex items-center justify-between w-full py-2 border-t border-border">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="flex items-center gap-1.5 transition-all active:scale-95">
              <Heart
                className={cn(
                  "h-5 w-5 transition-all",
                  isLiked ? "fill-[#c9424a] text-[#c9424a] scale-110" : "text-muted-foreground",
                )}
              />
              <span className={cn("text-sm font-medium", isLiked && "text-[#c9424a]")}>{likesCount}</span>
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

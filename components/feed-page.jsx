"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import PostCard from "@/components/post-card"
import StoriesBar from "@/components/stories-bar"
import { Loader2, RefreshCw, Film, ChevronLeft, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function FeedPage() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR("/api/posts", fetcher, {
    revalidateOnFocus: false,
  })
  const { data: reelsData } = useSWR("/api/reels", fetcher)
  const [refreshing, setRefreshing] = useState(false)
  const reelsScrollRef = useRef(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    await mutate()
    setRefreshing(false)
  }

  const scrollReels = (direction) => {
    if (reelsScrollRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200
      reelsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const posts = data?.posts || []
  const reels = reelsData?.reels || []

  return (
    <div className="space-y-4">
      <StoriesBar />

      <div className="p-4 space-y-4">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {reels.length > 0 && (
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Film className="h-4 w-4 text-blue-600" />
                Reels
              </h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => scrollReels("left")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => scrollReels("right")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div
              ref={reelsScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Create Reel Button */}
              <Link href="/reels">
                <div className="flex-shrink-0 w-24 h-40 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-400/20 border border-border flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mb-2">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium">Watch Reels</span>
                </div>
              </Link>

              {reels.slice(0, 10).map((reel) => (
                <Link key={reel._id} href="/reels">
                  <div className="flex-shrink-0 w-24 h-40 rounded-xl overflow-hidden relative cursor-pointer hover:scale-105 transition-transform">
                    {reel.thumbnail ? (
                      <img
                        src={reel.thumbnail || "/placeholder.svg"}
                        alt="Reel"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                        <Film className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <Avatar className="h-6 w-6 border border-white mb-1">
                        <AvatarImage src={reel.user?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{reel.user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-white text-xs font-medium truncate">{reel.user?.name}</p>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Create Post CTA */}
        <Link href="/create">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-blue-600/50 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">+</span>
            </div>
            <p className="text-muted-foreground">Create something amazing with AI...</p>
          </div>
        </Link>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No posts yet</p>
            <Link href="/create">
              <Button>Create Your First Post</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} currentUserId={user?._id} onUpdate={() => mutate()} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

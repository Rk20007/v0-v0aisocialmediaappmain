"use client"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ZoomablePostImage from "@/components/zoomable-post-image"
import { Settings, LogOut, Grid, Bookmark, MapPin, Calendar, Loader2, Zap, Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, logout, updateProfile } = useAuth()
  const [reminderSaving, setReminderSaving] = useState(false)

  useEffect(() => {
    if (user) {
      console.log("[v0] ProfilePage - Current user:", user.email, "ID:", user._id)
    }
  }, [user])

  const { data: postsData, isLoading } = useSWR(
    user?._id ? `/api/posts?userId=${user._id}&cache=${user._id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 0,
    },
  )

  const posts = postsData?.posts || []

  const { data: walletInfo } = useSWR(user ? "/api/wallet" : null, fetcher, {
    revalidateOnFocus: false,
  })

  const handleReminderToggle = async (checked) => {
    if (checked && typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission()
      if (perm !== "granted") {
        toast({
          title: "Notifications blocked",
          description: "Allow notifications in your browser settings to get daily reminders.",
          variant: "destructive",
        })
        return
      }
    }
    setReminderSaving(true)
    const res = await updateProfile({ dailyAiImageReminder: checked })
    setReminderSaving(false)
    if (!res?.success) {
      toast({ title: "Could not save preference", variant: "destructive" })
    }
  }

  const handleLogout = async () => {
    console.log("[v0] Profile logout initiated")
    await logout()
    router.push("/login")
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9424a]" />
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Cover & Avatar */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-[#c9424a]/30 to-[#e06b72]/30" />
        <div className="absolute -bottom-12 left-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-2xl bg-[#c9424a]/10 text-[#c9424a]">
              {user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => router.push("/profile/setup")}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" className="h-9 w-9" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-14 pb-4">
        <h1 className="text-xl font-bold">{user.name}</h1>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        {user.bio && <p className="text-muted-foreground mt-1">{user.bio}</p>}

        <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
          {user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {user.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-xl font-bold">{posts.length}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{user.friends?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Friends</p>
          </div>
        </div>

        {walletInfo?.success && (
          <div className="mt-3 rounded-xl border border-[#c9424a]/15 bg-[#c9424a]/5 px-3 py-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#c9424a] leading-tight">{walletInfo.coins ?? 0} coins</p>
                  <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[220px] sm:max-w-none">
                    {walletInfo.walletEnabled
                      ? `Starter ${walletInfo.starterFreeAiLeft ?? 0}/${walletInfo.starterFreeAiTotal ?? 2} free · reels ${walletInfo.reelsUploaded ?? 0}/${walletInfo.reelsRequiredBeforePaidAi ?? 5} for paid AI · then ${Math.max(10, Number(walletInfo.aiImageCostCoins) || 10)} coins · reel +2 · post +1 (free)`
                      : "Wallet off — all free"}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="secondary" className="h-8 text-[11px] px-2 shrink-0">
                <Link href="/create">Create</Link>
              </Button>
            </div>
            {walletInfo.walletEnabled && (
              <p className="text-[10px] text-muted-foreground">
                Posting is free (+1 coin). Optional share after post for bonus coins. Razorpay: admin can enable in App settings.
              </p>
            )}
            <label className="flex items-center gap-2 text-[11px] cursor-pointer select-none text-muted-foreground">
              <input
                type="checkbox"
                className="rounded border-muted-foreground/40 h-3.5 w-3.5"
                checked={!!user.dailyAiImageReminder}
                disabled={reminderSaving}
                onChange={(e) => handleReminderToggle(e.target.checked)}
              />
              <Bell className="h-3.5 w-3.5" />
              Daily browser reminder (app open)
            </label>
          </div>
        )}

        {/* Interests */}
        {user.interests?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {user.interests.map((interest, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Posts Grid */}
      <Tabs defaultValue="posts" className="px-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts" className="gap-2">
            <Grid className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#c9424a]" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No posts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) =>
                post.imageUrl ? (
                  <ZoomablePostImage key={post._id} src={post.imageUrl} alt="Post">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group">
                      <img
                        src={post.imageUrl || "/placeholder.svg"}
                        alt="Post"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  </ZoomablePostImage>
                ) : (
                  <div key={post._id} className="aspect-square bg-muted rounded-lg" />
                )
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="py-8 text-center">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No saved posts</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

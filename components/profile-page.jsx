"use client"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, LogOut, Grid, Bookmark, MapPin, Calendar, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const { data: postsData, isLoading } = useSWR(
    user?._id ? `/api/posts?userId=${user._id}&t=${Date.now()}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 0,
    },
  )

  const posts = postsData?.posts || []

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Cover & Avatar */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-primary/30 to-secondary/30" />
        <div className="absolute -bottom-12 left-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
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
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No posts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div key={post._id} className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {post.imageUrl && (
                    <img src={post.imageUrl || "/placeholder.svg"} alt="Post" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
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

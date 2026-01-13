"use client"

import { useState } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Grid,
  Film,
  MapPin,
  Calendar,
  Loader2,
  UserPlus,
  UserCheck,
  Clock,
  MessageCircle,
  UserX,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function UserProfilePage({ userId }) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const { data, isLoading, mutate } = useSWR(`/api/users/${userId}`, fetcher)
  const [actionLoading, setActionLoading] = useState(false)

  const user = data?.user
  const posts = data?.posts || []
  const reels = data?.reels || []

  const sendRequest = async () => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      })
      if (res.ok) {
        toast({ title: "Friend request sent!" })
        mutate()
      }
    } catch (error) {
      toast({ title: "Failed to send request", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const acceptRequest = async () => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: userId }),
      })
      if (res.ok) {
        toast({ title: "Friend request accepted!" })
        mutate()
      }
    } catch (error) {
      toast({ title: "Failed to accept request", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const removeFriend = async () => {
    setActionLoading(true)
    try {
      await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: userId }),
      })
      toast({ title: "Friend removed" })
      mutate()
    } catch (error) {
      toast({ title: "Failed to remove friend", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  // Check if viewing own profile
  const isOwnProfile = currentUser?._id === userId

  const renderActionButton = () => {
    if (isOwnProfile) return null

    if (actionLoading) {
      return (
        <Button disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      )
    }

    switch (user.relationship) {
      case "friend":
        return (
          <div className="flex gap-2">
            <Link href={`/messages/${userId}`}>
              <Button className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
            </Link>
            <Button variant="outline" onClick={removeFriend} className="text-destructive bg-transparent">
              <UserX className="h-4 w-4" />
            </Button>
          </div>
        )
      case "request_sent":
        return (
          <Button variant="outline" disabled className="gap-2 bg-transparent">
            <Clock className="h-4 w-4" />
            Request Sent
          </Button>
        )
      case "request_received":
        return (
          <Button onClick={acceptRequest} className="gap-2">
            <UserCheck className="h-4 w-4" />
            Accept Request
          </Button>
        )
      default:
        return (
          <Button onClick={sendRequest} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Friend
          </Button>
        )
    }
  }

  return (
    <div className="pb-4">
      {/* Back Button */}
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

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
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-14 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            {user.bio && <p className="text-muted-foreground mt-1">{user.bio}</p>}
          </div>
          {renderActionButton()}
        </div>

        <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
          {user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {user.location}
            </span>
          )}
          {user.createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-xl font-bold">{posts.length}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{reels.length}</p>
            <p className="text-xs text-muted-foreground">Reels</p>
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

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="px-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts" className="gap-2">
            <Grid className="h-4 w-4" />
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="reels" className="gap-2">
            <Film className="h-4 w-4" />
            Reels ({reels.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          {posts.length === 0 ? (
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

        <TabsContent value="reels" className="mt-4">
          {reels.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 text-center">
                <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No reels yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {reels.map((reel) => (
                <div key={reel._id} className="aspect-[9/16] bg-muted rounded-lg overflow-hidden relative">
                  {reel.thumbnail ? (
                    <img src={reel.thumbnail || "/placeholder.svg"} alt="Reel" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Film className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

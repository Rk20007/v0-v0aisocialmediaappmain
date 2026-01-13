"use client"

import { useState } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, UserCheck, UserX, Loader2, Users, MessageCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function FriendsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")

  const { data: allUsersData, mutate: mutateAllUsers, isLoading: isLoadingUsers } = useSWR("/api/users/all", fetcher)
  const { data: friendsData, mutate: mutateFriends } = useSWR("/api/friends", fetcher)
  const { data: requestsData, mutate: mutateRequests } = useSWR("/api/friends/requests", fetcher)

  const allUsers = allUsersData?.users || []
  const friends = friendsData?.friends || []
  const requests = requestsData?.requests || []

  const filteredUsers = allUsers.filter(
    (u) =>
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sendRequest = async (targetUserId) => {
    try {
      const res = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      })

      if (res.ok) {
        toast({ title: "Friend request sent!" })
        mutateAllUsers()
      } else {
        const data = await res.json()
        toast({ title: data.error || "Failed to send request", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Failed to send request", variant: "destructive" })
    }
  }

  const acceptRequest = async (requesterId) => {
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      })

      if (res.ok) {
        toast({ title: "Friend request accepted!" })
        mutateRequests()
        mutateFriends()
        mutateAllUsers()
      }
    } catch (error) {
      toast({ title: "Failed to accept request", variant: "destructive" })
    }
  }

  const rejectRequest = async (requesterId) => {
    try {
      await fetch("/api/friends/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      })
      mutateRequests()
      mutateAllUsers()
    } catch (error) {
      toast({ title: "Failed to reject request", variant: "destructive" })
    }
  }

  const removeFriend = async (friendId) => {
    try {
      await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      })
      toast({ title: "Friend removed" })
      mutateFriends()
      mutateAllUsers()
    } catch (error) {
      toast({ title: "Failed to remove friend", variant: "destructive" })
    }
  }

  const renderUserAction = (u) => {
    if (u.isFriend) {
      return (
        <div className="flex gap-1">
          <Link href={`/chat/${u._id}`}>
            <Button size="sm" variant="outline" className="gap-1 bg-transparent">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => removeFriend(u._id)} className="text-destructive">
            <UserX className="h-4 w-4" />
          </Button>
        </div>
      )
    }
    if (u.requestSent) {
      return (
        <Button size="sm" variant="outline" disabled className="gap-1 bg-transparent">
          <Clock className="h-4 w-4" />
          Pending
        </Button>
      )
    }
    if (u.requestReceived) {
      return (
        <div className="flex gap-1">
          <Button size="sm" onClick={() => acceptRequest(u._id)}>
            <UserCheck className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => rejectRequest(u._id)}>
            <UserX className="h-4 w-4" />
          </Button>
        </div>
      )
    }
    return (
      <Button size="sm" onClick={() => sendRequest(u._id)} className="gap-1">
        <UserPlus className="h-4 w-4" />
        Add
      </Button>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover" className="gap-2">
            <Users className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="friends" className="gap-2">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            Requests
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-4">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <Card key={u._id} className="border-0 shadow-lg">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={u.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{u.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{u.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{u.bio || u.location || u.email}</p>
                      </div>
                      {renderUserAction(u)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="friends" className="mt-4">
          {friends.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground">Go to Discover to find and add friends</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <Card key={friend._id} className="border-0 shadow-lg">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{friend.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{friend.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{friend.bio || friend.location}</p>
                      </div>
                      <div className="flex gap-1">
                        <Link href={`/chat/${friend._id}`}>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFriend(friend._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          {requests.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <Card key={req._id} className="border-0 shadow-lg">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={req.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{req.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{req.name}</p>
                        <p className="text-sm text-muted-foreground">wants to be your friend</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => acceptRequest(req._id)}>
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => rejectRequest(req._id)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Search, Loader2, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function MessagesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")

  const { data: conversationsData, isLoading: isLoadingConversations } = useSWR(
    user?._id ? `/api/conversations?cache=${user._id}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      dedupingInterval: 2000, // Prevent duplicate requests
    },
  )

  const { data: usersData, isLoading: isLoadingUsers } = useSWR(
    user?._id ? `/api/users/all?cache=${user._id}` : null,
    fetcher,
  )

  const conversations = conversationsData?.conversations || []
  const allUsers = usersData?.users || []

  const filteredConversations = conversations.filter((c) =>
    c.friend?.name?.toLowerCase().includes(search.toLowerCase()),
  )

  const conversationFriendIds = new Set(conversations.map((c) => c.friendId))
  const otherUsers = allUsers.filter((user) => !conversationFriendIds.has(user._id))

  const filteredOtherUsers = otherUsers.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase()))

  const isLoading = isLoadingConversations || isLoadingUsers

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {conversations.length} chats
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="pl-10"
        />
      </div>

      {/* Active Conversations */}
      {filteredConversations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-2">Active Chats</h2>
          {filteredConversations.map((conv) => (
            <Link key={conv.friendId} href={`/messages/${conv.friendId}`}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01]">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.friend?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{conv.friend?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold truncate">{conv.friend?.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {conv.lastMessage?.createdAt &&
                            formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Other Users to start chat with */}
      {filteredOtherUsers.length > 0 && (
        <div className="space-y-2 pt-2 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground px-2">Start a New Chat</h2>
          {filteredOtherUsers.map((user) => (
            <Link key={user._id} href={`/messages/${user._id}`}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01] mb-1">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">Start a conversation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredConversations.length === 0 && filteredOtherUsers.length === 0 && !isLoading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No conversations found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try a different search term" : "Start chatting with someone!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

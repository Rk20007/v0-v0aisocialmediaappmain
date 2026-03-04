"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Edit2, ChevronDown, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function MessagesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")

  const { data: conversationsData, isLoading: isLoadingConversations } = useSWR(
    user?._id ? `/api/conversations?cache=${user._id}` : null,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true, dedupingInterval: 2000 },
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
  const otherUsers = allUsers.filter((u) => !conversationFriendIds.has(u._id))
  const filteredOtherUsers = otherUsers.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()),
  )

  const isLoading = isLoadingConversations || isLoadingUsers

  return (
    <div className="flex flex-col min-h-[calc(100dvh-7.5rem)] bg-white dark:bg-black">

      {/* ── Instagram-style Header ── */}
      <div className="flex items-center justify-between px-4 py-3">
        <button className="flex items-center gap-1 active:opacity-70">
          <span className="text-[20px] font-bold text-black dark:text-white leading-tight">
            {user?.name || "Messages"}
          </span>
          <ChevronDown className="h-4 w-4 text-black dark:text-white mt-0.5" />
        </button>
        <button className="p-1 active:opacity-70">
          <Edit2 className="h-[22px] w-[22px] text-black dark:text-white" />
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="px-4 pb-3">
        <div className="relative flex items-center bg-gray-100 dark:bg-zinc-800 rounded-xl h-9">
          <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent pl-9 pr-3 text-sm text-black dark:text-white placeholder:text-gray-400 outline-none"
          />
        </div>
      </div>

      {/* ── Active users — story circles ── */}
      {allUsers.length > 0 && (
        <div className="px-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
          <div
            className="flex gap-4 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {allUsers.slice(0, 14).map((u) => (
              <Link
                key={u._id}
                href={`/messages/${u._id}`}
                className="flex flex-col items-center gap-1.5 shrink-0 active:opacity-70"
              >
                {/* Gradient ring avatar */}
                <div className="h-[58px] w-[58px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#c9424a] via-[#e06b72] to-[#f9a825]">
                  <div className="h-full w-full rounded-full bg-white dark:bg-black p-[2px]">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={u.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs font-semibold bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate max-w-[56px] text-center">
                  {u.name?.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Conversation list ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300 dark:text-gray-600" />
          </div>
        ) : (
          <>
            {/* Active conversations */}
            {filteredConversations.map((conv) => (
              <Link key={conv.friendId} href={`/messages/${conv.friendId}`}>
                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-900 active:bg-gray-100 dark:active:bg-zinc-800 transition-colors">
                  {/* Avatar with gradient ring + online dot */}
                  <div className="relative shrink-0">
                    <div className="h-[58px] w-[58px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#c9424a] via-[#e06b72] to-[#f9a825]">
                      <div className="h-full w-full rounded-full bg-white dark:bg-black p-[2px]">
                        <Avatar className="h-full w-full">
                          <AvatarImage src={conv.friend?.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-sm font-semibold">
                            {conv.friend?.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="absolute bottom-0.5 right-0.5 h-[14px] w-[14px] rounded-full bg-green-500 border-2 border-white dark:border-black" />
                  </div>

                  {/* Text info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-[2px]">
                      <p className={cn(
                        "text-[15px] text-black dark:text-white truncate",
                        conv.unreadCount > 0 ? "font-bold" : "font-semibold",
                      )}>
                        {conv.friend?.name}
                      </p>
                      <span className="text-[12px] text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                        {conv.lastMessage?.createdAt
                          ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-[13px] truncate",
                        conv.unreadCount > 0
                          ? "text-black dark:text-white font-semibold"
                          : "text-gray-500 dark:text-gray-400",
                      )}>
                        {conv.lastMessage?.content || "Start a conversation"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <div className="h-[18px] w-[18px] rounded-full bg-[#c9424a] flex items-center justify-center shrink-0 ml-2">
                          <span className="text-[10px] text-white font-bold leading-none">
                            {conv.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Suggested users (no existing conversation) */}
            {filteredOtherUsers.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                  Suggested
                </p>
                {filteredOtherUsers.map((u) => (
                  <Link key={u._id} href={`/messages/${u._id}`}>
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-900 active:bg-gray-100 transition-colors">
                      <Avatar className="h-[58px] w-[58px] shrink-0">
                        <AvatarImage src={u.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-sm font-semibold">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] text-black dark:text-white truncate">
                          {u.name}
                        </p>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400">Tap to message</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}

            {/* Empty state */}
            {filteredConversations.length === 0 && filteredOtherUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 gap-3 mt-8">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Search className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-[15px] font-semibold text-black dark:text-white">No results</p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                  {search ? "Try a different name" : "Start a conversation with someone"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Loader2, Phone, Video, Info, Camera, Mic, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function ChatPage({ friendId }) {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const { data: messagesData, mutate } = useSWR(
    friendId && user?._id ? `/api/messages?friendId=${friendId}&cache=${user._id}` : null,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: true, dedupingInterval: 1000 },
  )

  const { data: friendData } = useSWR(friendId ? `/api/users/${friendId}` : null, fetcher)

  const messages = messagesData?.messages || []
  const friend = friendData?.user

  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, shouldAutoScroll])

  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setShouldAutoScroll(isAtBottom)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!message.trim() || isSending || !friendId) return

    setIsSending(true)
    const content = message.trim()
    setMessage("")

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      senderId: user?._id,
      receiverId: friendId,
      content,
      createdAt: new Date().toISOString(),
      sending: true,
    }

    mutate({ ...messagesData, messages: [...messages, tempMessage] }, false)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: friendId, content }),
        credentials: "include",
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to send message")
      await mutate()
    } catch {
      setMessage(content)
      mutate()
    } finally {
      setIsSending(false)
    }
  }

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {})

  /* ── Loading skeleton ── */
  if (!friend) {
    return (
      <div className="flex flex-col h-[100dvh] bg-white dark:bg-black">
        <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200 dark:border-zinc-800">
          <Link href="/messages">
            <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 active:opacity-70">
              <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
            </button>
          </Link>
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-black">

      {/* ── Instagram-style Header ── */}
      <div className="flex items-center gap-1 px-1 py-2 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-black">
        {/* Back */}
        <Link href="/messages">
          <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 active:opacity-70 shrink-0">
            <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
          </button>
        </Link>

        {/* Avatar + name */}
        <Link href={`/user/${friendId}`} className="flex items-center gap-2.5 flex-1 min-w-0 active:opacity-70">
          <div className="relative shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={friend?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-sm font-bold">
                {friend?.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-[10px] w-[10px] rounded-full bg-green-500 border-2 border-white dark:border-black" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[15px] text-black dark:text-white leading-tight truncate">
              {friend?.name}
            </p>
            <p className="text-[11px] text-green-500 font-medium">Active now</p>
          </div>
        </Link>

        {/* Action icons */}
        <div className="flex items-center shrink-0">
          <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 active:opacity-70">
            <Phone className="h-[22px] w-[22px] text-black dark:text-white" />
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 active:opacity-70">
            <Video className="h-[22px] w-[22px] text-black dark:text-white" />
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 active:opacity-70">
            <Info className="h-[22px] w-[22px] text-black dark:text-white" />
          </button>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 bg-white dark:bg-black"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full mx-auto mb-4 overflow-hidden ring-2 ring-[#c9424a]/20">
                <Avatar className="h-full w-full">
                  <AvatarImage src={friend?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl font-bold">
                    {friend?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <p className="font-bold text-[17px] text-black dark:text-white mb-1">{friend?.name}</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                Say hi to start a conversation!
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center justify-center py-4">
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                  {new Date(date).toDateString() === new Date().toDateString()
                    ? "Today"
                    : new Date(date).toDateString() ===
                        new Date(Date.now() - 86400000).toDateString()
                      ? "Yesterday"
                      : date}
                </span>
              </div>

              {msgs.map((msg, index) => {
                const isOwn = msg.senderId === user?._id
                const nextMsg = msgs[index + 1]
                const prevMsg = msgs[index - 1]
                const isLastInSeq = !nextMsg || nextMsg.senderId !== msg.senderId
                const isFirstInSeq = !prevMsg || prevMsg.senderId !== msg.senderId
                const showAvatar = !isOwn && isLastInSeq
                const showTime = isLastInSeq

                return (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex gap-2 items-end",
                      isOwn ? "justify-end" : "justify-start",
                      isFirstInSeq ? "mt-3" : "mt-[3px]",
                    )}
                  >
                    {/* Friend avatar placeholder (keeps alignment) */}
                    {!isOwn && (
                      <div className="w-7 shrink-0 flex flex-col justify-end mb-0.5">
                        {showAvatar && (
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={friend?.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-[10px] font-bold">
                              {friend?.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div className={cn("flex flex-col max-w-[72%]", isOwn ? "items-end" : "items-start")}>
                      {/* Bubble */}
                      <div
                        className={cn(
                          "px-4 py-[10px] text-[15px] leading-relaxed break-words",
                          isOwn
                            ? "bg-gradient-to-br from-[#c9424a] to-[#e06b72] text-white rounded-[22px] rounded-tr-[5px]"
                            : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white rounded-[22px] rounded-tl-[5px]",
                          !isLastInSeq && isOwn && "rounded-br-[5px]",
                          !isLastInSeq && !isOwn && "rounded-bl-[5px]",
                          msg.sending && "opacity-60",
                        )}
                      >
                        <p className="text-[14px] whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Timestamp */}
                      {showTime && (
                        <span
                          className={cn(
                            "text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1",
                            isOwn ? "text-right" : "text-left",
                          )}
                        >
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          {msg.sending && " · Sending…"}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Instagram-style Input Bar ── */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-black">
        <form onSubmit={handleSend}>
          <div className="flex items-center gap-2">
            {/* Camera icon */}
            <button
              type="button"
              className="shrink-0 p-1 active:opacity-70"
            >
              <Camera className="h-[26px] w-[26px] text-[#c9424a]" />
            </button>

            {/* Pill input */}
            <div className="flex-1 flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full px-4 py-[9px] gap-2 min-w-0">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message…"
                className="flex-1 bg-transparent text-[14px] text-black dark:text-white placeholder:text-gray-400 outline-none min-w-0"
                disabled={isSending}
              />
              {/* Mic icon — shown when input is empty */}
              {!message.trim() && (
                <button type="button" className="shrink-0 active:opacity-70">
                  <Mic className="h-5 w-5 text-[#c9424a]" />
                </button>
              )}
            </div>

            {/* Send / Heart */}
            {message.trim() ? (
              <button
                type="submit"
                disabled={isSending}
                className="shrink-0 active:opacity-70"
              >
                {isSending ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#c9424a]" />
                ) : (
                  <Send className="h-6 w-6 text-[#c9424a]" />
                )}
              </button>
            ) : (
              <button type="button" className="shrink-0 active:opacity-70">
                <Heart className="h-[26px] w-[26px] text-[#c9424a]" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

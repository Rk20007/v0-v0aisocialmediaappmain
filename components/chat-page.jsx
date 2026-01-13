"use client"

import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Loader2, MoreVertical } from "lucide-react"
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
    {
      refreshInterval: 3000, // Poll every 3 seconds
      revalidateOnFocus: true,
      dedupingInterval: 1000, // Prevent duplicate requests within 1 second
    },
  )

  const { data: friendData } = useSWR(friendId ? `/api/users/${friendId}` : null, fetcher)

  const messages = messagesData?.messages || []
  const friend = friendData?.user

  useEffect(() => {
    if (messages.length > 0) {
      console.log("[v0] Chat messages loaded:", messages.length, "messages")
    }
  }, [messages.length])

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

    mutate(
      {
        ...messagesData,
        messages: [...messages, tempMessage],
      },
      false,
    )

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: friendId, content }),
        credentials: "include",
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to send message")
      }

      console.log("[v0] Message sent successfully")

      await mutate()
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
      setMessage(content)
      mutate()
    } finally {
      setIsSending(false)
    }
  }

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(msg)
    return groups
  }, {})

  if (!friend) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card shadow-sm">
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card shadow-sm">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend?.avatar || "/placeholder.svg"} />
          <AvatarFallback>{friend?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{friend?.name || "Loading..."}</p>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar bg-muted/20"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start the conversation!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="space-y-3">
              {/* Date Divider */}
              <div className="flex items-center justify-center">
                <Badge variant="secondary" className="text-xs">
                  {new Date(date).toDateString() === new Date().toDateString()
                    ? "Today"
                    : new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString()
                      ? "Yesterday"
                      : date}
                </Badge>
              </div>

              {/* Messages for this date */}
              {msgs.map((msg, index) => {
                const isOwn = msg.senderId === user?._id
                const showAvatar = index === msgs.length - 1 || msgs[index + 1]?.senderId !== msg.senderId
                const showTime = index === msgs.length - 1 || msgs[index + 1]?.senderId !== msg.senderId

                return (
                  <div key={msg._id} className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}>
                    {!isOwn && (
                      <Avatar className={cn("h-8 w-8 mt-auto", !showAvatar && "opacity-0")}>
                        <AvatarImage src={friend?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{friend?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start", "max-w-[75%]")}>
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl break-words",
                          isOwn
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-card border border-border rounded-bl-md",
                          msg.sending && "opacity-60",
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {showTime && (
                        <span className="text-xs text-muted-foreground mt-1 px-1">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          {msg.sending && " • Sending..."}
                        </span>
                      )}
                    </div>

                    {isOwn && <div className="w-8" />}
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border bg-card shadow-sm">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
            autoFocus
          />
          <Button type="submit" disabled={!message.trim() || isSending} size="icon" className="h-10 w-10">
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </form>
    </div>
  )
}

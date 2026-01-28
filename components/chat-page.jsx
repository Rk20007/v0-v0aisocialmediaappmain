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
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card shadow-sm mb-4">
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
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-50 dark:bg-black">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
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
        className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#c9424a]/10 dark:bg-[#c9424a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={friend?.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{friend?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <p className="font-semibold text-lg mb-1">{friend?.name}</p>
              <p className="text-sm text-muted-foreground">Start chatting with {friend?.name}</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="relative flex items-center justify-center py-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
                  <span className="bg-slate-50 dark:bg-black px-3 text-muted-foreground/60">
                    {new Date(date).toDateString() === new Date().toDateString()
                      ? "Today"
                      : new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString()
                        ? "Yesterday"
                        : date}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              {msgs.map((msg, index) => {
                const isOwn = msg.senderId === user?._id
                const nextMsg = msgs[index + 1]
                const prevMsg = msgs[index - 1]
                
                const isLastInSequence = !nextMsg || nextMsg.senderId !== msg.senderId
                const isFirstInSequence = !prevMsg || prevMsg.senderId !== msg.senderId
                
                const showAvatar = !isOwn && isLastInSequence
                const showTime = isLastInSequence

                return (
                  <div 
                    key={msg._id} 
                    className={cn(
                      "flex gap-2", 
                      isOwn ? "justify-end" : "justify-start",
                      isFirstInSequence ? "mt-4" : "mt-1"
                    )}
                  >
                    {!isOwn && (
                      <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={friend?.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{friend?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div className={cn("flex flex-col max-w-[75%] md:max-w-[60%]", isOwn ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "px-4 py-2 shadow-sm text-[15px] leading-relaxed break-words",
                          isOwn
                            ? "bg-[#c9424a] text-white rounded-2xl rounded-tr-sm"
                            : "bg-white dark:bg-zinc-800 text-foreground border border-border/40 rounded-2xl rounded-tl-sm",
                          !isLastInSequence && isOwn && "rounded-br-sm",
                          !isLastInSequence && !isOwn && "rounded-bl-sm",
                          msg.sending && "opacity-60",
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {showTime && (
                        <span className={cn("text-[10px] text-muted-foreground mt-1 px-1 select-none", isOwn ? "text-right" : "text-left")}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          {msg.sending && " • Sending..."}
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

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-background">
        <div className="flex gap-2 items-center max-w-4xl mx-auto">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 rounded-full bg-muted/50 border-transparent focus:border-[#c9424a] focus:bg-background transition-all h-11"
            disabled={isSending}
            autoFocus
          />
          <Button type="submit" disabled={!message.trim() || isSending} size="icon" className="h-11 w-11 rounded-full shrink-0 bg-[#c9424a] hover:bg-[#a0353b] shadow-md">
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </form>
    </div>
  )
}

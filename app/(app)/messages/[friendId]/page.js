import ChatPage from "@/components/chat-page"

export const metadata = {
  title: "Chat - Colorcode",
}

export default async function Chat({ params }) {
  const { friendId } = await params
  return <ChatPage friendId={friendId} />
}

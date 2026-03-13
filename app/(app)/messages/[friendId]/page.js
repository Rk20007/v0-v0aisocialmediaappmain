import ChatPage from "@/components/chat-page"

export const metadata = {
  title: "Chat - ColorKode",
}

export default async function Chat({ params }) {
  const { friendId } = await params
  return <ChatPage friendId={friendId} />
}

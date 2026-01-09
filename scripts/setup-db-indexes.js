import { getDb } from "@/lib/mongodb.js"

async function setupIndexes() {
  try {
    console.log("[Setup] Creating database indexes...")

    const db = await getDb()

    // Users collection indexes
    const users = db.collection("users")
    await users.createIndex({ email: 1 }, { unique: true, sparse: true })
    await users.createIndex({ mobile: 1 }, { unique: true, sparse: true })
    await users.createIndex({ createdAt: -1 })
    await users.createIndex({ lastLogin: -1 })
    console.log("[Setup] ✓ Users indexes created")

    // Posts collection indexes
    const posts = db.collection("posts")
    await posts.createIndex({ userId: 1, createdAt: -1 })
    await posts.createIndex({ createdAt: -1 })
    await posts.createIndex({ likes: 1 })
    console.log("[Setup] ✓ Posts indexes created")

    // Reels collection indexes
    const reels = db.collection("reels")
    await reels.createIndex({ userId: 1, createdAt: -1 })
    await reels.createIndex({ createdAt: -1 })
    await reels.createIndex({ likes: 1 })
    console.log("[Setup] ✓ Reels indexes created")

    // Stories collection indexes
    const stories = db.collection("stories")
    await stories.createIndex({ userId: 1, createdAt: -1 })
    await stories.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    console.log("[Setup] ✓ Stories indexes created")

    // Messages collection indexes
    const messages = db.collection("messages")
    await messages.createIndex({ conversationId: 1, createdAt: -1 })
    await messages.createIndex({ senderId: 1 })
    await messages.createIndex({ receiverId: 1 })
    console.log("[Setup] ✓ Messages indexes created")

    // Conversations collection indexes
    const conversations = db.collection("conversations")
    await conversations.createIndex({ participants: 1 })
    await conversations.createIndex({ lastMessageAt: -1 })
    console.log("[Setup] ✓ Conversations indexes created")

    console.log("[Setup] Database indexes setup completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[Setup] Error setting up indexes:", error.message)
    process.exit(1)
  }
}

setupIndexes()

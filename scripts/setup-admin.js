/**
 * Creates or updates the admin account.
 * Mobile: 7740847114 | Password: robin@123
 *
 * Usage: node scripts/setup-admin.js
 */

const { MongoClient, ObjectId } = require("mongodb")
const bcrypt = require("bcryptjs")

// Load .env.local manually (no dotenv dependency needed)
const fs = require("fs")
const path = require("path")

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local")
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

const MOBILE = "7740847114"
const PASSWORD = "robin@123"
const NAME = "Admin"

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("❌ MONGODB_URI not set in .env.local")
    process.exit(1)
  }

  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB")

    const db = client.db("colorcode")
    const users = db.collection("users")

    const hashedPassword = await bcrypt.hash(PASSWORD, 12)

    const existing = await users.findOne({ mobile: MOBILE })

    if (existing) {
      // Update existing user → set isAdmin + update password
      await users.updateOne(
        { _id: existing._id },
        {
          $set: {
            isAdmin: true,
            password: hashedPassword,
            updatedAt: new Date(),
          },
        }
      )
      console.log(`✅ Updated existing user: ${existing.name} (${MOBILE})`)
      console.log(`   isAdmin: true | password reset to: ${PASSWORD}`)
      console.log(`   User ID: ${existing._id}`)
    } else {
      // Create new admin user
      const newUser = {
        _id: new ObjectId(),
        email: "",
        mobile: MOBILE,
        password: hashedPassword,
        name: NAME,
        bio: "",
        location: "",
        interests: [],
        avatar: "",
        coverImage: "",
        friends: [],
        friendRequests: [],
        sentRequests: [],
        coins: 9999,
        coinHistory: [
          {
            type: "bonus",
            coins: 9999,
            amount: 0,
            description: "Admin account setup",
            date: new Date(),
          },
        ],
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileComplete: true,
        lastLogin: new Date(),
      }

      await users.insertOne(newUser)
      console.log(`✅ Created new admin user`)
      console.log(`   Mobile: ${MOBILE}`)
      console.log(`   Password: ${PASSWORD}`)
      console.log(`   User ID: ${newUser._id}`)
    }

    console.log("\n🚀 Login at: http://localhost:3000/login")
    console.log("🛡️  Admin panel: http://localhost:3000/admin")
  } catch (err) {
    console.error("❌ Error:", err.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

run()

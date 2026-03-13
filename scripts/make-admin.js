/**
 * Script to grant admin privileges to a user by email or mobile.
 *
 * Usage:
 *   node scripts/make-admin.js user@example.com
 *   node scripts/make-admin.js 9876543210
 */

const { MongoClient } = require("mongodb")
require("dotenv").config({ path: ".env.local" })

async function makeAdmin() {
  const identifier = process.argv[2]

  if (!identifier) {
    console.error("Usage: node scripts/make-admin.js <email_or_mobile>")
    process.exit(1)
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("MONGODB_URI not set in .env.local")
    process.exit(1)
  }

  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("colorcode")
    const users = db.collection("users")

    const query = {
      $or: [
        { email: identifier.toLowerCase().trim() },
        { mobile: identifier.trim() },
      ],
    }

    const user = await users.findOne(query)

    if (!user) {
      console.error(`No user found with email/mobile: ${identifier}`)
      process.exit(1)
    }

    await users.updateOne({ _id: user._id }, { $set: { isAdmin: true } })

    console.log(`✅ Admin granted to: ${user.name} (${user.email || user.mobile})`)
    console.log(`   User ID: ${user._id}`)
    console.log(`   Visit: http://localhost:3000/admin`)
  } finally {
    await client.close()
  }
}

makeAdmin().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})

import { MongoClient } from "mongodb"

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client
let clientPromise

function getClientPromise() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error("[v0] MONGODB_URI environment variable is not set")
    return null
  }

  if (clientPromise) return clientPromise

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }

  return clientPromise
}

export default getClientPromise

export async function getDb() {
  const promise = getClientPromise()

  if (!promise) {
    throw new Error("MongoDB connection not configured. Please add MONGODB_URI to environment variables.")
  }

  const client = await promise
  return client.db("colorcode")
}

import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getAppSettings, publicAppSettings } from "@/lib/app-settings"

/** Public read — safe fields for clients (no secrets). */
export async function GET() {
  try {
    const db = await getDb()
    const settings = await getAppSettings(db)
    return NextResponse.json({
      success: true,
      settings: publicAppSettings(settings),
    })
  } catch (error) {
    console.error("[app-settings] GET error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to load settings" }, { status: 500 })
  }
}

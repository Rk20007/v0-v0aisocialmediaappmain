"use client"

import { use } from "react"
import UserProfilePage from "@/components/user-profile-page"

export default function UserPage({ params }) {
  const { userId } = use(params)
  return <UserProfilePage userId={userId} />
}

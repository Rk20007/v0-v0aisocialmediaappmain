import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import AdminSidebar from "@/components/admin/admin-sidebar"

export const metadata = {
  title: "Admin — ColorKode",
}

export default async function AdminLayout({ children }) {
  const session = await getSession()
  if (!session) redirect("/login")

  const db = await getDb()
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(session.userId) }, { projection: { isAdmin: 1, name: 1 } })

  if (!user?.isAdmin) redirect("/feed")

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar adminName={user.name} />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 min-h-screen">{children}</main>
    </div>
  )
}

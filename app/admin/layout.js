import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Ban, Shield } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Admin — ColorKode",
}

export default async function AdminLayout({ children }) {
  const session = await getSession()
  if (!session) {
    // Don't redirect - let /admin show login prompt
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
            <Shield className="h-10 w-10 text-white opacity-50" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-lg text-gray-600 mb-8">Please login at <Link href="/admin/login" className="text-[#c9424a] font-semibold hover:underline">/admin/login</Link></p>
        </div>
      </div>
    )
  }

  const db = await getDb()
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(session.userId) }, { projection: { isAdmin: 1, name: 1 } })

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
            <Ban className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access Denied</h1>
          <p className="text-lg text-gray-600 mb-8">Contact administrator for access.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9424a] text-white font-semibold hover:bg-[#a0353b] transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar adminName={user.name} />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 min-h-screen">{children}</main>
    </div>
  )
}


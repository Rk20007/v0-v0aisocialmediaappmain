"use client"

import { useEffect, useState } from "react"
import { Users, FileText, ImageIcon, CreditCard, Coins, TrendingUp, UserCheck, Ban } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentRecharges, setRecentRecharges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStats(d.stats)
          setRecentRecharges(d.recentRecharges || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-[#c9424a] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">ColorKode platform overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers?.toLocaleString()} sub={`+${stats?.newUsersThisWeek} this week`} color="bg-blue-500" />
        <StatCard icon={FileText} label="Total Posts" value={stats?.totalPosts?.toLocaleString()} color="bg-purple-500" />
        <StatCard icon={ImageIcon} label="AI Images" value={stats?.totalImages?.toLocaleString()} color="bg-[#c9424a]" />
        <StatCard icon={CreditCard} label="Revenue" value={`₹${stats?.totalRevenue?.toLocaleString()}`} color="bg-green-500" />
        <StatCard icon={Coins} label="Coins in Circulation" value={stats?.totalCoins?.toLocaleString()} color="bg-yellow-500" />
        <StatCard icon={TrendingUp} label="Total Reels" value={stats?.totalReels?.toLocaleString()} color="bg-pink-500" />
        <StatCard icon={Ban} label="Banned Users" value={stats?.bannedUsers} color="bg-red-500" />
        <StatCard icon={UserCheck} label="Admin Users" value={stats?.adminUsers} color="bg-indigo-500" />
      </div>

      {/* Recent Recharges */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent Recharges</h2>
        </div>
        {recentRecharges.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">No recharges yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentRecharges.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {r.userName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.userName || "Unknown"}</p>
                    <p className="text-xs text-gray-400">
                      {r.date ? formatDistanceToNow(new Date(r.date), { addSuffix: true }) : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">+{r.coins} coins</p>
                  <p className="text-xs text-gray-400">₹{r.amount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

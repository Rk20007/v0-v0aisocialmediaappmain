"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Trash2, Ban, CheckCircle, Shield, ShieldOff, Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

function Badge({ children, color }) {
  const colors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  )
}

function RechargeModal({ user, onClose, onSuccess }) {
  const [coins, setCoins] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!coins || parseInt(coins) <= 0) { setError("Enter a valid coin amount"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/users/${user._id}/recharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coins: parseInt(coins), note }),
      })
      const data = await res.json()
      if (data.success) { onSuccess(data.newBalance); onClose() }
      else setError(data.error || "Failed")
    } catch { setError("Network error") }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="font-bold text-gray-900 mb-1">Add Coins</h3>
        <p className="text-sm text-gray-500 mb-4">Adding coins to <span className="font-medium text-gray-900">{user.name}</span> (current: {user.coins})</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="number" min="1" value={coins} onChange={(e) => setCoins(e.target.value)}
            placeholder="Coins to add" required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9424a]/30"
          />
          <input
            type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9424a]/30"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-[#c9424a] text-white text-sm font-medium hover:bg-[#b03840] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Add Coins
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditModal({ user, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: user.name || "", email: user.email || "", mobile: user.mobile || "", coins: user.coins || 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) { onSuccess(data.user); onClose() }
      else setError(data.error || "Failed")
    } catch { setError("Network error") }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="font-bold text-gray-900 mb-4">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[["Name", "name", "text"], ["Email", "email", "email"], ["Mobile", "mobile", "text"], ["Coins", "coins", "number"]].map(([label, key, type]) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
              <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9424a]/30" />
            </div>
          ))}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-[#c9424a] text-white text-sm font-medium hover:bg-[#b03840] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [rechargeUser, setRechargeUser] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20, search })
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounce search
  useEffect(() => { setPage(1) }, [search])

  const toggleBan = async (user) => {
    setActionLoading(user._id + "_ban")
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ banned: !user.banned }),
      })
      const data = await res.json()
      if (data.success) setUsers((prev) => prev.map((u) => u._id === user._id ? data.user : u))
    } finally { setActionLoading(null) }
  }

  const toggleAdmin = async (user) => {
    if (!confirm(`${user.isAdmin ? "Remove admin from" : "Make admin"}: ${user.name}?`)) return
    setActionLoading(user._id + "_admin")
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      })
      const data = await res.json()
      if (data.success) setUsers((prev) => prev.map((u) => u._id === user._id ? data.user : u))
    } finally { setActionLoading(null) }
  }

  const deleteUser = async (user) => {
    if (!confirm(`Permanently delete ${user.name} and all their content?`)) return
    setActionLoading(user._id + "_delete")
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, { method: "DELETE", credentials: "include" })
      const data = await res.json()
      if (data.success) { setUsers((prev) => prev.filter((u) => u._id !== user._id)); setTotal((t) => t - 1) }
    } finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or mobile..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c9424a]/30 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-[#c9424a]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Coins</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#c9424a]/10 flex items-center justify-center text-xs font-bold text-[#c9424a] flex-shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            {user.name}
                            {user.isAdmin && <Shield className="h-3 w-3 text-blue-500" />}
                          </p>
                          <p className="text-xs text-gray-400 md:hidden">{user.email || user.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-700">{user.email || "—"}</p>
                      <p className="text-xs text-gray-400">{user.mobile || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{user.coins ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                      {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {user.banned ? <Badge color="red">Banned</Badge> : <Badge color="green">Active</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Add coins */}
                        <button onClick={() => setRechargeUser(user)} title="Add coins"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                        {/* Edit */}
                        <button onClick={() => setEditUser(user)} title="Edit user"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors text-xs font-medium px-2">
                          Edit
                        </button>
                        {/* Ban/Unban */}
                        <button onClick={() => toggleBan(user)} title={user.banned ? "Unban" : "Ban"}
                          disabled={actionLoading === user._id + "_ban"}
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors disabled:opacity-40">
                          {actionLoading === user._id + "_ban" ? <Loader2 className="h-4 w-4 animate-spin" /> : user.banned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>
                        {/* Admin toggle */}
                        <button onClick={() => toggleAdmin(user)} title={user.isAdmin ? "Remove admin" : "Make admin"}
                          disabled={actionLoading === user._id + "_admin"}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors disabled:opacity-40">
                          {actionLoading === user._id + "_admin" ? <Loader2 className="h-4 w-4 animate-spin" /> : user.isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                        {/* Delete */}
                        <button onClick={() => deleteUser(user)} title="Delete user"
                          disabled={actionLoading === user._id + "_delete"}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40">
                          {actionLoading === user._id + "_delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {rechargeUser && (
        <RechargeModal
          user={rechargeUser}
          onClose={() => setRechargeUser(null)}
          onSuccess={(newBalance) => {
            setUsers((prev) => prev.map((u) => u._id === rechargeUser._id ? { ...u, coins: newBalance } : u))
          }}
        />
      )}
      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={(updated) => setUsers((prev) => prev.map((u) => u._id === updated._id ? updated : u))}
        />
      )}
    </div>
  )
}

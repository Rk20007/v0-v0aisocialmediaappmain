"use client"

import { useEffect, useState, useCallback } from "react"
import { CreditCard, Loader2, ChevronLeft, ChevronRight, IndianRupee } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

const TYPE_LABELS = {
  recharge: { label: "Razorpay", color: "bg-green-100 text-green-700" },
  admin_recharge: { label: "Admin", color: "bg-blue-100 text-blue-700" },
}

export default function AdminRechargesPage() {
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 30, type: typeFilter })
      const res = await fetch(`/api/admin/recharges?${params}`, { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setTotalRevenue(data.totalRevenue)
      }
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [typeFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recharges</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} transactions · Total revenue: ₹{totalRevenue.toLocaleString()}</p>
      </div>

      {/* Revenue card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
          <IndianRupee className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-green-100 text-sm">Total Razorpay Revenue</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[["all", "All"], ["recharge", "Razorpay"], ["admin_recharge", "Admin"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              typeFilter === val
                ? "bg-[#c9424a] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-[#c9424a]" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Coins</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Payment ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx, i) => {
                  const typeInfo = TYPE_LABELS[tx.type] || { label: tx.type, color: "bg-gray-100 text-gray-600" }
                  return (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#c9424a]/10 flex items-center justify-center text-xs font-bold text-[#c9424a] flex-shrink-0">
                            {tx.userName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{tx.userName || "Unknown"}</p>
                            <p className="text-xs text-gray-400">{tx.userEmail || tx.userMobile || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-green-600">+{tx.coins}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {tx.amount > 0 ? <span className="font-medium text-gray-900">₹{tx.amount}</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {tx.paymentId ? (
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{tx.paymentId}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">{tx.description || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {tx.date ? (
                          <span title={format(new Date(tx.date), "dd MMM yyyy, HH:mm")}>
                            {formatDistanceToNow(new Date(tx.date), { addSuffix: true })}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  )
                })}
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
    </div>
  )
}

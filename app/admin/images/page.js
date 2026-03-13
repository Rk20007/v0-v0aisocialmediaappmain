"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Loader2, ChevronLeft, ChevronRight, ImageIcon, User, Zap } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

export default function AdminImagesPage() {
  const [images, setImages] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCoinsSpent, setTotalCoinsSpent] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 30, search })
      const res = await fetch(`/api/admin/images?${params}`, { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setImages(data.images)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setTotalCoinsSpent(data.totalCoinsSpent)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Image Generations</h1>
        <p className="text-gray-500 text-sm mt-1">
          {total.toLocaleString()} total generations · {totalCoinsSpent.toLocaleString()} coins spent
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-[#c9424a] flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Images</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-yellow-500 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalCoinsSpent.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Coins Spent</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by topic or user name..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c9424a]/30 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-[#c9424a]" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No image generations found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Topic</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Extras</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Coins</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {images.map((img) => (
                  <tr key={img._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#c9424a]/10 flex items-center justify-center text-xs font-bold text-[#c9424a] flex-shrink-0">
                          {img.userName?.charAt(0)?.toUpperCase() || <User className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{img.userName || "Unknown"}</p>
                          <p className="text-xs text-gray-400">{img.userEmail || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 max-w-[200px] truncate" title={img.topic}>{img.topic}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex gap-1">
                        {img.hasCharacterImage && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Character</span>
                        )}
                        {img.hasUniformImage && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">Uniform</span>
                        )}
                        {!img.hasCharacterImage && !img.hasUniformImage && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-yellow-600 flex items-center gap-1">
                        <Zap className="h-3 w-3" />{img.coinsUsed ?? 20}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        img.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {img.status || "success"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {img.createdAt ? (
                        <span title={format(new Date(img.createdAt), "dd MMM yyyy, HH:mm")}>
                          {formatDistanceToNow(new Date(img.createdAt), { addSuffix: true })}
                        </span>
                      ) : "—"}
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
    </div>
  )
}

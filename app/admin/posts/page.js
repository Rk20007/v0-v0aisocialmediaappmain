"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Trash2, Loader2, ChevronLeft, ChevronRight, Heart, MessageCircle, ImageIcon } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20, search })
      const res = await fetch(`/api/admin/posts?${params}`, { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setPosts(data.posts)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [search])

  const deletePost = async (post) => {
    if (!confirm(`Delete post by ${post.userName}?`)) return
    setDeletingId(post._id)
    try {
      const res = await fetch(`/api/admin/posts/${post._id}`, { method: "DELETE", credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== post._id))
        setTotal((t) => t - 1)
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total posts</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by content, caption or topic..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c9424a]/30 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-[#c9424a]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No posts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Author</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Content</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Stats</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Image</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#c9424a]/10 flex items-center justify-center text-xs font-bold text-[#c9424a] flex-shrink-0">
                          {post.userName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <p className="font-medium text-gray-900 whitespace-nowrap">{post.userName || "Unknown"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-gray-700 truncate" title={post.caption || post.content}>
                        {post.caption || post.content || <span className="text-gray-400 italic">No text</span>}
                      </p>
                      {post.topic && (
                        <p className="text-xs text-[#c9424a] mt-0.5 truncate">#{post.topic}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-3 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5 text-red-400" />{post.likesCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5 text-blue-400" />{post.commentsCount ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {post.imageUrl ? (
                        <a href={post.imageUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:underline text-xs">
                          <ImageIcon className="h-3.5 w-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {post.createdAt ? (
                        <span title={format(new Date(post.createdAt), "dd MMM yyyy, HH:mm")}>
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deletePost(post)}
                        disabled={deletingId === post._id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40"
                        title="Delete post"
                      >
                        {deletingId === post._id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </button>
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

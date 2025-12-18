"use client"

import { createContext, useContext, useState, useEffect } from "react"
import useSWR from "swr"

const AuthContext = createContext(null)

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export function AuthProvider({ children }) {
  const [cacheKey, setCacheKey] = useState(() => `/api/auth/me?t=${Date.now()}`)

  const { data, error, mutate } = useSWR(cacheKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
    dedupingInterval: 0, // Disable deduping to always fetch fresh data
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (data !== undefined || error) {
      setIsLoading(false)
    }
  }, [data, error])

  const user = data?.user || null
  const isAuthenticated = !!user

  const login = async (credentials) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    })
    const data = await res.json()
    if (data.success) {
      const newCacheKey = `/api/auth/me?t=${Date.now()}`
      setCacheKey(newCacheKey)
      await mutate(data, false)
    }
    return data
  }

  const signup = async (userData) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
      credentials: "include",
    })
    const data = await res.json()
    if (data.success) {
      const newCacheKey = `/api/auth/me?t=${Date.now()}`
      setCacheKey(newCacheKey)
      await mutate({ user: data.user }, false)
    }
    return data
  }

  const logout = async () => {
    await mutate({ user: null }, false)

    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })

    const newCacheKey = `/api/auth/me?t=${Date.now()}`
    setCacheKey(newCacheKey)

    if (typeof window !== "undefined") {
      const swrCache = mutate.cache
      if (swrCache && typeof swrCache.clear === "function") {
        swrCache.clear()
      }
    }
  }

  const updateProfile = async (profileData) => {
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
      credentials: "include",
    })
    const data = await res.json()
    if (data.success) {
      await mutate({ user: data.user }, false)
    }
    return data
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        refresh: () => {
          const newCacheKey = `/api/auth/me?t=${Date.now()}`
          setCacheKey(newCacheKey)
          return mutate()
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

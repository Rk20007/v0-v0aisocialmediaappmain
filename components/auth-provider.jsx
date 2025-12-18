"use client"

import { createContext, useContext, useState, useEffect } from "react"
import useSWR from "swr"

const AuthContext = createContext(null)

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export function AuthProvider({ children }) {
  const [cacheKey, setCacheKey] = useState(() => `/api/auth/me?session=${Math.random()}`)

  const { data, error, mutate } = useSWR(cacheKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false, // Disable to prevent unwanted refetch
    shouldRetryOnError: false,
    dedupingInterval: 0,
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (data !== undefined || error) {
      setIsLoading(false)
    }
  }, [data, error])

  const user = data?.user || null
  const isAuthenticated = !!user

  useEffect(() => {
    console.log("[v0] Auth state changed - User:", user ? user.email : "None")
  }, [user])

  const login = async (credentials) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    })
    const data = await res.json()
    if (data.success) {
      console.log("[v0] Login successful, clearing cache and fetching new user")
      const newCacheKey = `/api/auth/me?session=${Math.random()}`
      setCacheKey(newCacheKey)

      // Clear all SWR cache
      if (typeof window !== "undefined") {
        const cache = mutate.cache
        if (cache && typeof cache.clear === "function") {
          cache.clear()
        }
      }

      // Wait a bit for cookie to be set, then fetch fresh data
      await new Promise((resolve) => setTimeout(resolve, 100))
      await mutate()
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
      console.log("[v0] Signup successful, clearing cache and fetching new user")
      const newCacheKey = `/api/auth/me?session=${Math.random()}`
      setCacheKey(newCacheKey)

      if (typeof window !== "undefined") {
        const cache = mutate.cache
        if (cache && typeof cache.clear === "function") {
          cache.clear()
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
      await mutate()
    }
    return data
  }

  const logout = async () => {
    console.log("[v0] Logging out...")

    await mutate({ user: null }, false)

    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })

    const newCacheKey = `/api/auth/me?session=${Math.random()}`
    setCacheKey(newCacheKey)

    if (typeof window !== "undefined") {
      const cache = mutate.cache
      if (cache && typeof cache.clear === "function") {
        cache.clear()
      }
      // Also clear any other storage that might cache user data
      sessionStorage.clear()
    }

    console.log("[v0] Logout complete - all cache cleared")
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
          const newCacheKey = `/api/auth/me?session=${Math.random()}`
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

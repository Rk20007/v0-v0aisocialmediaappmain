"use client"

import { createContext, useContext, useState, useEffect } from "react"
import useSWR from "swr"

const AuthContext = createContext(null)

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export function AuthProvider({ children }) {
  const [cacheKey, setCacheKey] = useState(() => `/api/auth/me?t=${Date.now()}`)
  const [isLoading, setIsLoading] = useState(true)

  const { data, error, mutate } = useSWR(cacheKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
    dedupingInterval: 0,
  })

  useEffect(() => {
    if (data !== undefined || error) {
      setIsLoading(false)
    }
  }, [data, error])

  const user = data?.user || null
  const isAuthenticated = !!user

  useEffect(() => {
    if (user) {
      console.log(`[v0] Auth state: User logged in - ${user.email || user.mobile}`)
    } else {
      console.log("[v0] Auth state: No user")
    }
  }, [user])

  const login = async (credentials) => {
    console.log("[v0] Login initiated")
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    })
    const data = await res.json()

    if (data.success) {
      console.log(`[v0] Login successful for user: ${data.user._id}`)

      const newCacheKey = `/api/auth/me?t=${Date.now()}`
      setCacheKey(newCacheKey)

      await new Promise((resolve) => setTimeout(resolve, 100))
      await mutate()
    }
    return data
  }

  const signup = async (userData) => {
    console.log("[v0] Signup initiated")
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
      credentials: "include",
    })
    const data = await res.json()

    if (data.success) {
      console.log(`[v0] Signup successful for user: ${data.user._id}`)

      const newCacheKey = `/api/auth/me?t=${Date.now()}`
      setCacheKey(newCacheKey)

      await new Promise((resolve) => setTimeout(resolve, 100))
      await mutate()
    }
    return data
  }

  const logout = async () => {
    console.log("[v0] Logout initiated")

    await mutate({ user: null }, false)

    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })

    const newCacheKey = `/api/auth/me?t=${Date.now()}`
    setCacheKey(newCacheKey)

    console.log("[v0] Logout complete")
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

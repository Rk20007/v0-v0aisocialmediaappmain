"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    mobile: "7740847114",
    password: "robin@123"
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Check if admin
        const meRes = await fetch("/api/auth/me", { credentials: "include" })
        const me = await meRes.json()
        
        if (me.isAdmin) {
          router.push("/admin")
          toast({ title: "Admin login successful!" })
        } else {
          setError("Admin access required")
        }
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#c9424a] to-[#e06b72] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Admin Login</CardTitle>
          <CardDescription className="text-slate-300">Enter admin credentials to access panel</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-white font-semibold">Mobile</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="7740847114"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="h-12 bg-white/20 border-white/30 text-white placeholder-slate-300 focus:ring-[#c9424a]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="robin@123"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 bg-white/20 border-white/30 text-white placeholder-slate-300 focus:ring-[#c9424a]"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-100 text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-[#c9424a] to-[#e06b72] hover:from-[#a0353b] text-white font-bold shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Enter Admin Panel"
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-slate-800/50 rounded-xl text-center text-sm text-slate-400">
            <p>Admin: <strong>7740847114</strong> / <strong>robin@123</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


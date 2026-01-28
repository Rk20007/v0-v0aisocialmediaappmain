"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Camera, Loader2, X, MapPin, ChevronDown } from "lucide-react"

const INTEREST_OPTIONS = [
  "Photography",
  "Art",
  "Music",
  "Travel",
  "Food",
  "Fashion",
  "Technology",
  "Sports",
  "Gaming",
  "Movies",
  "Books",
  "Nature",
  "Fitness",
  "Dance",
  "Comedy",
  "Science",
]

const PROFESSION_OPTIONS = [
  "Actor",
  "Influencer",
  "Artist",
  "Musician",
  "Photographer",
  "Model",
  "Designer",
  "Developer",
  "Student",
  "Entrepreneur",
  "Writer",
  "Dancer",
  "Comedian",
  "Gamer",
  "Others",
]

export default function ProfileSetup() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: user?.name || "",
    profession: user?.profession || "",
    location: user?.location || "",
    interests: user?.interests || [],
    avatar: user?.avatar || "",
  })

  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/feed")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update profile")
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>Tell us more about yourself</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-[#c9424a]/20">
                    <AvatarImage src={formData.avatar || "/placeholder.svg"} alt="Profile" />
                    <AvatarFallback className="text-2xl bg-[#c9424a]/10 text-[#c9424a]">
                      {formData.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2 bg-[#c9424a] text-white rounded-full shadow-lg hover:bg-[#a0353b] transition-colors"
                    onClick={() => document.getElementById("avatar-input").click()}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          setFormData((prev) => ({ ...prev, avatar: ev.target?.result }))
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your display name"
                  className="h-12"
                  required
                />
              </div>

              {/* Profession */}
              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <div className="relative">
                  <select
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    required
                  >
                    <option value="" disabled>Select your profession</option>
                    {PROFESSION_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Mumbai, India"
                    className="h-12 pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className={`cursor-pointer text-sm py-1.5 px-3 transition-all ${formData.interests.includes(interest) ? "bg-[#c9424a] text-white border-[#c9424a]" : "hover:border-[#c9424a]"}`}
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                      {formData.interests.includes(interest) && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <Button type="submit" className="w-full h-12 text-lg font-semibold bg-[#c9424a] hover:bg-[#a0353b] text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

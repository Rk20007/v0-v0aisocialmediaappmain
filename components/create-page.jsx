"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, Loader2, X, Send, Upload, Image } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CreatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [topic, setTopic] = useState("")
  const [caption, setCaption] = useState("")
  const [tags, setTags] = useState("")
  const [imageSrc, setImageSrc] = useState("")
  const [characterImage, setCharacterImage] = useState("")
  const [uniformImage, setUniformImage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  const handleGenerate = async () => {
    if (!characterImage) {
      toast({
        title: "Character Image Required",
        description: "कृपया एक character image अपलोड करें",
        variant: "destructive",
      })
      return
    }
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "कृपया एक topic enter करें",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const body = {
        topic: topic,
        character_Image: characterImage,
        uniformImage: uniformImage,
      }

      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.success && data.data?.url) {
        setImageSrc(data.data.url)
        toast({
          title: "✨ Image Generated!",
          description: "आपकी AI creation तैयार है",
        })
      } else {
        toast({
          title: "Generation Failed",
          description: data.error || "कृपया फिर से try करें",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePost = async () => {
    if (!imageSrc) {
      toast({
        title: "No Image",
        description: "पहले image generate करें",
        variant: "destructive",
      })
      return
    }

    setIsPosting(true)
    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim().replace("#", ""))
        .filter(Boolean)

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageSrc,
          caption,
          tags: tagsArray,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "🎉 Posted!",
          description: "आपकी creation अब live है",
        })
        router.push("/feed")
      } else {
        toast({
          title: "Failed to Post",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setCharacterImage(ev.target?.result)
        toast({
          title: "✓ Character Selected",
          description: "Image upload successful",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCharacterImage = () => {
    setCharacterImage("")
    const input = document.getElementById("gallery-input")
    if (input) input.value = ""
  }

  const handleUniformFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setUniformImage(ev.target?.result)
        toast({
          title: "✓ Uniform Selected",
          description: "Image upload successful",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeUniformImage = () => {
    setUniformImage("")
    const input = document.getElementById("uniform-input")
    if (input) input.value = ""
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Generating Popup Modal */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-3xl p-10 max-w-md mx-4 text-center shadow-2xl animate-scale-in border-4 border-red-200">
            <div className="mb-8 relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse-scale shadow-2xl">
                <Sparkles className="h-16 w-16 text-white animate-spin-slow" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-4 border-red-300 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Generating Image
            </h3>
            <p className="text-xl font-semibold text-gray-700 mb-2">
              कृपया प्रतीक्षा करें...
            </p>
            <p className="text-lg text-gray-500 mb-6">
              Please wait, creating magic ✨
            </p>
            <div className="flex gap-3 justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }}></div>
              <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }}></div>
              <div className="w-4 h-4 bg-orange-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center pt-8 pb-6 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl rotate-12 animate-float">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Color Code
            </h1>
          </div>
          <p className="text-gray-600 text-xl font-medium">AI के साथ अपना creative vision बनाएं</p>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-lg animate-slide-up overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-3xl -z-10"></div>
          
          <CardContent className="p-8 space-y-8">
            {/* Character Image Upload - TOP */}
            <div className="space-y-4">
              <Label className="text-xl font-bold flex items-center gap-3 text-gray-800">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Image className="h-5 w-5 text-white" />
                </div>
                Character Image
                <span className="text-sm text-red-600 font-semibold bg-red-100 px-3 py-1 rounded-full">Required</span>
              </Label>
              
              {!characterImage ? (
                <div 
                  onClick={() => document.getElementById("gallery-input")?.click()}
                  className="relative border-4 border-dashed border-red-300 rounded-3xl p-12 text-center cursor-pointer hover:border-red-500 hover:bg-red-50/80 transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-pink-100/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                      <Upload className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800 mb-2">Upload Your Character</p>
                      <p className="text-base text-gray-600">PNG, JPG or JPEG • Max 10MB</p>
                      <p className="text-sm text-gray-500 mt-2">यहाँ क्लिक करके character image upload करें</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border-4 border-red-400 shadow-2xl animate-scale-in group">
                  <img 
                    src={characterImage} 
                    alt="Character" 
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={removeCharacterImage}
                    className="absolute top-4 right-4 p-3 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all hover:scale-110 shadow-2xl hover:rotate-90 duration-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-lg font-bold flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        Character Ready
                      </p>
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-white text-sm font-semibold">✓ Uploaded</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <input 
                type="file" 
                id="gallery-input" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>

            {/* Uniform Image Upload - BELOW CHARACTER */}
            <div className="space-y-4">
              <Label className="text-xl font-bold flex items-center gap-3 text-gray-800">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Image className="h-5 w-5 text-white" />
                </div>
                Uniform / Dress Reference
                <span className="text-sm text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-full">Optional</span>
              </Label>
              
              {!uniformImage ? (
                <div 
                  onClick={() => document.getElementById("uniform-input")?.click()}
                  className="relative border-4 border-dashed border-purple-300 rounded-3xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/80 transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                      <Upload className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800 mb-2">Upload Uniform</p>
                      <p className="text-base text-gray-600">PNG, JPG or JPEG • Max 10MB</p>
                      <p className="text-sm text-gray-500 mt-2">Optional: Dress style reference</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border-4 border-purple-400 shadow-2xl animate-scale-in group">
                  <img 
                    src={uniformImage} 
                    alt="Uniform" 
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={removeUniformImage}
                    className="absolute top-4 right-4 p-3 bg-purple-500 rounded-full text-white hover:bg-purple-600 transition-all hover:scale-110 shadow-2xl hover:rotate-90 duration-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-lg font-bold flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                        Uniform Ready
                      </p>
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-white text-sm font-semibold">✓ Uploaded</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <input 
                type="file" 
                id="uniform-input" 
                accept="image/*" 
                className="hidden" 
                onChange={handleUniformFileChange} 
              />
            </div>

            {/* Topic Input - BELOW CHARACTER */}
            <div className="space-y-3">
              <Label htmlFor="topic" className="text-xl font-bold flex items-center gap-3 text-gray-800">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                Topic / विषय
              </Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Ladies Saadi, Traditional Wear, Fashion..."
                className="h-16 text-lg font-medium border-3 border-gray-300 focus:border-red-500 rounded-2xl shadow-lg transition-all px-6"
              />
              <p className="text-sm text-gray-500 ml-2">आप क्या बनाना चाहते हैं? यहाँ लिखें</p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic || !characterImage}
              className="w-full h-16 gap-4 text-xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 hover:from-red-700 hover:via-pink-700 hover:to-orange-700 transition-all shadow-2xl hover:shadow-red-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-2xl"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin" />
                  <span className="animate-pulse">Creating Magic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-7 w-7" />
                  Generate AI Image
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Image Preview & Post Section */}
        {imageSrc && (
          <Card className="border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur-lg animate-scale-in">
            <CardContent className="p-0">
              {/* Generated Image */}
              <div className="relative group">
                <img
                  src={imageSrc}
                  alt="Generated AI Image"
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-6 left-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 animate-bounce-in">
                  <Sparkles className="h-5 w-5 animate-spin-slow" />
                  AI Generated ✨
                </div>
                <button
                  onClick={() => setImageSrc("")}
                  className="absolute top-6 right-6 p-4 bg-red-500/90 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-all hover:scale-110 shadow-2xl hover:rotate-90 duration-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Post Details */}
              <div className="p-8 space-y-6 bg-gradient-to-br from-red-50/50 to-pink-50/50">
                <div className="space-y-3">
                  <Label htmlFor="caption" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-2xl">💬</span> Caption
                  </Label>
                  <textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="अपनी creativity के बारे में कुछ लिखें..."
                    className="w-full min-h-28 resize-none text-base border-3 border-gray-300 focus:border-red-500 rounded-2xl p-4 shadow-lg transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tags" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-2xl">#️⃣</span> Tags
                  </Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="#art, #ai, #fashion, #creative"
                    className="h-14 text-base border-3 border-gray-300 focus:border-red-500 rounded-2xl shadow-lg px-5"
                  />
                </div>

                <Button 
                  onClick={handlePost} 
                  disabled={isPosting} 
                  className="w-full h-16 gap-4 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-2xl hover:shadow-green-500/50 hover:scale-105 rounded-2xl"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-7 w-7" />
                      Share to Feed 🚀
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Example Prompts */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-gray-700 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-red-600" />
              Example Ideas / उदाहरण विचार
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[
                { text: "पारंपरिक भारतीय शादी", emoji: "💒" },
                { text: "Traditional Wedding", emoji: "👰" },
                { text: "आधुनिक फैशन", emoji: "👗" },
                { text: "Sunset Beach", emoji: "🌅" },
                { text: "साड़ी में सुंदर", emoji: "🥻" },
                { text: "Cyberpunk Style", emoji: "🤖" },
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(example.text)}
                  className="text-base bg-gradient-to-r from-red-100 to-pink-100 px-5 py-3 rounded-full hover:from-red-200 hover:to-pink-200 transition-all font-semibold text-gray-700 hover:scale-110 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <span>{example.emoji}</span>
                  {example.text}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bounce-in {
          0% { 
            transform: scale(0);
            opacity: 0;
          }
          50% { 
            transform: scale(1.15);
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes pulse-scale {
          0%, 100% { 
            transform: scale(1);
          }
          50% { 
            transform: scale(1.15);
          }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-10px) rotate(12deg); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

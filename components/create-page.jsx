"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, Loader2, X, Send, Image, Plus } from "lucide-react" // Removed Upload as it's not directly used here
import { useToast } from "@/components/use-toast" // Corrected import path

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
  const [useUniform, setUseUniform] = useState(false)
 
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
        uniformImage: useUniform ? uniformImage : null,
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

      <div className="max-w-md mx-auto space-y-6 relative z-10 pb-20">
        {/* Header */}
        <div className="text-center pt-8 pb-6 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl rotate-12 animate-float">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Colorcode
            </h1>
          </div>
          <p className="text-gray-600 text-xl font-medium">अपनी पसंदीदा ड्रेस में AI इमेज बनाएं</p>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-lg animate-slide-up overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-3xl -z-10"></div>
          
          <CardContent className="p-5 space-y-6">
            {/* Character Image Upload - TOP */}
            <div className="space-y-4">
              <Label className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                  <Image className="h-5 w-5 text-white" />
                </div>
                अपनी फोटो / चेहरा अपलोड करें
                <span className="text-xs text-red-600 font-semibold bg-red-100 px-2 py-0.5 rounded-full">Required</span>
              </Label>
              
              {!characterImage ? (
                <div 
                  onClick={() => document.getElementById("gallery-input")?.click()}
                  className="relative h-32 border-2 border-dashed border-red-300 rounded-2xl flex flex-col items-center justify-center bg-red-50/30 hover:bg-red-50 transition-all cursor-pointer group overflow-hidden"
                >
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-red-500">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 text-center">फोटो अपलोड करें</p>
                      <p className="text-[10px] text-gray-500 text-center">Tap to select image</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-48 rounded-2xl overflow-hidden border-2 border-red-400 shadow-lg animate-scale-in group">
                  <img 
                    src={characterImage} 
                    alt="Character" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={removeCharacterImage}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
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

            {/* Uniform Toggle & Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                <input
                  type="checkbox" 
                  id="useUniform"
                  checked={useUniform}
                  onChange={(e) => setUseUniform(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Label htmlFor="useUniform" className="text-sm font-semibold text-gray-700 flex-1 cursor-pointer">
                  ड्रेस या यूनिफॉर्म की फोटो अपलोड करें
                  <span className="block text-xs text-gray-500 font-normal">Optional</span>
                </Label>
              </div>
              
              {useUniform && (
                <div className="animate-fade-in">
                  {!uniformImage ? (
                    <div 
                      onClick={() => document.getElementById("uniform-input")?.click()}
                      className="relative h-28 border-2 border-dashed border-purple-300 rounded-2xl flex flex-col items-center justify-center bg-purple-50/30 hover:bg-purple-50 transition-all cursor-pointer group mt-2"
                    >
                      <div className="relative flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-purple-500">
                          <Plus className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-gray-700">ड्रेस अपलोड करें</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-40 rounded-2xl overflow-hidden border-2 border-purple-400 shadow-lg animate-scale-in">
                      <img 
                        src={uniformImage} 
                        alt="Uniform" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={removeUniformImage}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-purple-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="uniform-input" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleUniformFileChange} 
                  >
                  </input>
                </div>
              )}
            </div>

            {/* Topic Input - BELOW CHARACTER */}
            <div className="space-y-3">
              <Label htmlFor="topic" className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                किस तरह की इमेज चाहिए?
              </Label>
              <div className="relative">
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)} // Keep English for input for broader AI understanding
                  placeholder="e.g., Ladies Saadi, Traditional Wear..."
                  className="h-14 text-base font-medium border-2 border-gray-200 focus:border-red-500 rounded-xl shadow-sm transition-all px-4 bg-gray-50 focus:bg-white"
                />
              </div>

              {/* Example Prompts - Horizontal Scroll */}
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide -mx-1 px-1">
                {[
                  { text: "पारंपरिक भारतीय शादी", emoji: "💒" },
                  { text: "सुंदर दुल्हन", emoji: "👰" },
                  { text: "आधुनिक ड्रेस", emoji: "👗" },
                  { text: "समुद्र किनारे", emoji: "🌅" },
                  { text: "साड़ी में सुंदर", emoji: "🥻" },
                  { text: "स्टाइलिश लुक", emoji: "✨" },
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setTopic(example.text)}
                    className="flex-shrink-0 text-xs font-medium bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-red-300 hover:bg-red-50 transition-all text-gray-600 whitespace-nowrap shadow-sm flex items-center gap-1.5 active:scale-95"
                  >
                    <span>{example.emoji}</span>
                    {example.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic || !characterImage}
              className="w-full h-14 gap-2 text-lg font-bold bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 hover:from-red-700 hover:via-pink-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-xl mt-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="animate-pulse">Creating Magic...</span>
                </> // Keep English for loading for broader audience
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
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
                    onChange={(e) => setCaption(e.target.value)} // Keep English for input for broader AI understanding
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
                    onChange={(e) => setTags(e.target.value)} // Keep English for input for broader AI understanding
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

"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Loader2, X, Send, Image, Plus, Camera, FolderOpen, Download, Edit, Share2, ChevronDown, Maximize2, Mic, MicOff, RotateCcw, Camera as CameraIcon, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { FREE_IMAGES_LIMIT } from "@/lib/image-quota"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function CreatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [topic, setTopic] = useState("")
  const [manualPrompt, setManualPrompt] = useState("")
  const [caption, setCaption] = useState("")
  const [tags, setTags] = useState("")
  const [imageSrc, setImageSrc] = useState("")
  const [characterImage, setCharacterImage] = useState("")
  const [uniformImageSrc, setUniformImageSrc] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [useUniform, setUseUniform] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [showFullView, setShowFullView] = useState(false)
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [facingMode, setFacingMode] = useState("user")

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const basePromptRef = useRef("") // stores text before voice started

  // Fetch wallet/coin data (for checking balance only)
  const { data: walletData, mutate: mutateWallet } = useSWR("/api/wallet", fetcher, {
    revalidateOnFocus: false,
  })

  const coins = walletData?.coins || 0
  const walletEnabled = walletData?.walletEnabled === true
  /** Paid AI image: at least 10 coins (matches server) */
  const paidAiCoins = Math.max(10, Number(walletData?.aiImageCostCoins) || 10)
  const reelsUploaded = walletData?.reelsUploaded ?? 0
  const reelsRequired = walletData?.reelsRequiredBeforePaidAi ?? 5
  const aiUnlimitedOff = walletData?.aiUnlimitedWhileWalletOff === true
  const starterFreeAiLeft = walletData?.starterFreeAiLeft ?? 0
  const starterFreeAiTotal = walletData?.starterFreeAiTotal ?? FREE_IMAGES_LIMIT
  const paidAiReelGateOk = starterFreeAiLeft > 0 || reelsUploaded >= reelsRequired
  const canPayForAi = paidAiReelGateOk && coins >= paidAiCoins
  // Load saved data from memory on mount
  useEffect(() => {
    const savedImage = sessionStorage.getItem('generatedImage')
    const savedCaption = sessionStorage.getItem('imageCaption')
    const savedTags = sessionStorage.getItem('imageTags')
    
    if (savedImage) setImageSrc(savedImage)
    if (savedCaption) setCaption(savedCaption)
    if (savedTags) setTags(savedTags)
    
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Save to memory whenever image changes
  useEffect(() => {
    if (imageSrc) {
      sessionStorage.setItem('generatedImage', imageSrc)
    }
  }, [imageSrc])

  useEffect(() => {
    if (caption) sessionStorage.setItem('imageCaption', caption)
  }, [caption])

  useEffect(() => {
    if (tags) sessionStorage.setItem('imageTags', tags)
  }, [tags])

  // Voice recognition functions
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support voice input. Please type manually.",
        variant: "destructive",
      })
      return
    }

    // Save current text as base so interim results don't duplicate
    basePromptRef.current = manualPrompt.trim()

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-IN'

    recognitionRef.current.onstart = () => {
      setIsListening(true)
      toast({ title: "🎤 Listening...", description: "Speak your prompt now" })
    }

    recognitionRef.current.onresult = (event) => {
      // Build transcript from all results so far (interim + final)
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')

      // SET (not append) — base + new transcript to avoid duplication
      const separator = basePromptRef.current ? ' ' : ''
      setManualPrompt(basePromptRef.current + separator + transcript)
      setTopic("")
    }

    recognitionRef.current.onerror = (event) => {
      if (event.error !== "no-speech") {
        toast({
          title: "Voice Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        })
      }
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current.start()
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // Camera functions
  const openCamera = async (mode = facingMode) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setFacingMode(mode)
      setIsCameraOpen(true)
    } catch (error) {
      console.error("Camera error:", error)
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const flipCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user"
    openCamera(newMode)
  }

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')

      // Mirror the captured image for front camera (selfie)
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(videoRef.current, 0, 0)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      setCharacterImage(dataUrl)
      closeCamera()
      toast({ title: "✓ Photo Captured!", description: "Face picture ready for AI generation" })
    }
  }

  // Combined prompts for single dropdown (en = AI prompt value, hi = display label)
  const allPrompts = [
    {
      category: "Women - महिला",
      prompts: [
        { en: "Beautiful bride in traditional red saree", hi: "पारंपरिक लाल साड़ी में सुंदर दुल्हन" },
        { en: "Bride in dark saree during wedding ritual", hi: "शादी की रस्म में गहरे रंग की साड़ी" },
        { en: "Beautiful girl in yellow mehendi suit", hi: "पीले रंग की मेहंदी सूट में खूबसूरत लड़की" },
        { en: "Bride in pink lehenga choli", hi: "गुलाबी लहंगा चोली में दुल्हन" },
        { en: "Red saree with golden border", hi: "सुनहरी बॉर्डर वाली रेड साड़ी" },
        { en: "Desi look in blue saree", hi: "नीली साड़ी में देसी लुक" },
        { en: "Stylish green salwar suit", hi: "हरे रंग का स्टाइलिश सलवार सूट" },
        { en: "Wedding look in maroon lehenga", hi: "मरून लहंगा में शादी का लुक" },
        { en: "Traditional style in orange saree", hi: "ऑरेंज साड़ी में ट्रेडिशनल स्टाइल" },
        { en: "Elegant look in white and gold saree", hi: "सफेद और गोल्ड साड़ी में एलिगेंट लुक" },
        { en: "Modern look in pink party dress", hi: "पिंक पार्टी ड्रेस में मॉडर्न लुक" },
        { en: "Bold look in black saree", hi: "काली साड़ी में बोल्ड अवतार" },
        { en: "Sangeet ceremony look in purple lehenga", hi: "बैंगनी लहंगा में संगीत सेरेमनी" },
        { en: "Casual look in turquoise suit", hi: "फिरोजी सूट में कैजुअल लुक" },
        { en: "Festival look in golden saree", hi: "गोल्डन साड़ी में फेस्टिवल लुक" },
      ]
    },
    {
      category: "Men - पुरुष",
      prompts: [
        { en: "Handsome groom in white sherwani", hi: "सफेद शेरवानी में हैंडसम दूल्हा" },
        { en: "Cream color sherwani look", hi: "क्रीम कलर का शेरवानी लुक" },
        { en: "Royal look in golden sherwani", hi: "गोल्डन शेरवानी में शाही अंदाज" },
        { en: "Smart look in navy blue suit", hi: "नेवी ब्लू सूट में स्मार्ट लुक" },
        { en: "Wedding look in maroon sherwani", hi: "मरून शेरवानी में शादी का लुक" },
        { en: "Desi style in black kurta pajama", hi: "काला कुर्ता पजामा में देसी स्टाइल" },
        { en: "Traditional look in off-white kurta", hi: "ऑफ-व्हाइट कुर्ता में ट्रेडिशनल लुक" },
        { en: "Elegant style in brown sherwani", hi: "ब्राउन शेरवानी में एलिगेंट स्टाइल" },
        { en: "Modern groom in pink sherwani", hi: "पिंक शेरवानी में मॉडर्न दूल्हा" },
        { en: "Formal look in grey suit", hi: "ग्रे सूट में फॉर्मल लुक" },
        { en: "Simple look in white kurta pajama", hi: "सफेद कुर्ता पायजामा में सिंपल लुक" },
        { en: "Sangeet ceremony in beige sherwani", hi: "बेज शेरवानी में संगीत सेरेमनी" },
        { en: "Western look in black tuxedo", hi: "ब्लैक टक्सीडो में वेस्टर्न लुक" },
        { en: "Royal style in ivory sherwani", hi: "आइवरी शेरवानी में रॉयल स्टाइल" },
        { en: "Casual look in dark blue kurta", hi: "डार्क ब्लू कुर्ता में कैजुअल लुक" },
      ]
    }
  ]

  const handleGenerate = async () => {
    if (!characterImage) {
      toast({
        title: "Character Image Required",
        description: "कृपया एक character image अपलोड करें",
        variant: "destructive",
      })
      return
    }

    const finalPrompt = manualPrompt.trim() || topic.trim()
    
    if (!finalPrompt) {
      toast({
        title: "Prompt Required",
        description: "कृपया एक prompt select या लिखें",
        variant: "destructive",
      })
      return
    }

    const canUseAi =
      !walletEnabled ||
      aiUnlimitedOff ||
      starterFreeAiLeft > 0 ||
      canPayForAi

    if (walletEnabled && !canUseAi) {
      if (starterFreeAiLeft <= 0 && !paidAiReelGateOk) {
        toast({
          title: "Upload more reels",
          description: `After your ${starterFreeAiTotal} free AI images, upload at least ${reelsRequired} reels to unlock paid AI (you have ${reelsUploaded}/${reelsRequired}). Each reel earns +2 coins — 5 reels = 10 coins for one image.`,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Need more coins",
        description: `Paid AI costs ${paidAiCoins} coins. Post to the feed for free and earn +1 coin each time.`,
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setShowEditForm(false)
    setShowPostForm(false)
    try {
      const body = {
        topic: finalPrompt,
        character_Image: characterImage,
        uniformImage: useUniform ? uniformImageSrc : null,
      }

      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.success && data.data?.url) {
        setImageSrc(data.data.url)
        
        const deductRes = await fetch("/api/wallet/deduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose: "ai_image" }),
          credentials: "include",
        })

        const deductData = await deductRes.json()
        if (!deductData.success) {
          setImageSrc("")
          sessionStorage.removeItem("generatedImage")
          const msg =
            deductData.error === "REELS_GATE"
              ? deductData.message ||
                `Upload ${deductData.reelsRequiredBeforePaidAi ?? reelsRequired} reels first (you have ${deductData.reelsUploaded ?? reelsUploaded}).`
              : deductData.error || "Balance could not be updated."
          toast({
            title: deductData.error === "REELS_GATE" ? "Reels required" : "Could not update balance",
            description: msg,
            variant: "destructive",
          })
        } else {
          mutateWallet()

          let costText = "No charge"
          if (deductData.skipped) {
            costText = "Wallet off — free"
          } else if (deductData.usedStarterFree) {
            costText =
              deductData.starterFreeAiLeft !== undefined
                ? `Starter free · ${deductData.starterFreeAiLeft} left`
                : "Starter free 🎁"
          } else if (deductData.charged) {
            costText = `- ${deductData.charged} coins`
          } else if (walletEnabled) {
            costText = `- ${paidAiCoins} coins`
          }

          toast({
            title: "✨ Image Generated!",
            description: `आपकी AI creation तैयार है (${costText})`,
          })
        }
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
        credentials: "include",
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "🎉 Posted!",
          description: walletEnabled
            ? "Feed पर live है — posting is free · +1 coin added"
            : "आपकी creation अब live है",
        })
        if (walletEnabled) await mutateWallet()
        sessionStorage.removeItem('generatedImage')
        sessionStorage.removeItem('imageCaption')
        sessionStorage.removeItem('imageTags')
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
        setUniformImageSrc(ev.target?.result)
        toast({
          title: "✓ Uniform Selected",
          description: "Uniform reference uploaded",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeUniformImage = () => {
    setUniformImageSrc("")
    const input = document.getElementById("uniform-input")
    if (input) input.value = ""
  }

  const handleDownload = async () => {
    if (!imageSrc) return
    
    try {
      const response = await fetch(imageSrc)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `blue-class-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Downloaded! ✓",
        description: "Image saved successfully",
      })
    } catch (error) {
      const link = document.createElement('a')
      link.href = imageSrc
      link.target = "_blank"
      link.download = `blue-class-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Opened in new tab",
        description: "Please save the image manually",
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share && imageSrc) {
      try {
        await navigator.share({
          title: 'Blue Class AI Creation',
          text: caption || 'Check out my AI-generated image!',
          url: imageSrc
        })
      } catch (err) {
        toast({
          title: "Share",
          description: "Unable to share at this moment",
        })
      }
    } else {
      toast({
        title: "Share",
        description: "Share feature not available",
        variant: "destructive",
      })
    }
  }

  const handleEdit = () => {
    setShowEditForm(true)
    setShowPostForm(false)
  }

  const clearAllData = () => {
    sessionStorage.removeItem('generatedImage')
    sessionStorage.removeItem('imageCaption')
    sessionStorage.removeItem('imageTags')
    setImageSrc("")
    setCaption("")
    setTags("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4a181b] via-[#7d292e] to-[#4a181b] p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#c9424a] rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-[#c9424a] rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-[#c9424a] rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Camera Modal */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && closeCamera()}>
        <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-black border-none focus:outline-none">
          <DialogTitle className="sr-only">Take Photo</DialogTitle>
          <div className="relative bg-black">
            {/* Mirror video for front camera selfie */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto rounded-lg"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            {/* Top label */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full">
              <p className="text-white font-semibold text-sm">
                {facingMode === "user" ? "📸 Selfie" : "📷 Camera"}
              </p>
            </div>
            {/* Camera controls */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8">
              {/* Close */}
              <button
                onClick={closeCamera}
                className="p-3 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              {/* Capture shutter */}
              <button
                onClick={capturePhoto}
                className="h-20 w-20 rounded-full bg-white border-4 border-[#c9424a] flex items-center justify-center hover:bg-gray-100 transition-colors shadow-xl active:scale-95"
              >
                <div className="h-14 w-14 rounded-full bg-[#c9424a]" />
              </button>
              {/* Flip camera */}
              <button
                onClick={flipCamera}
                className="p-3 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
              >
                <RotateCcw className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generating Popup Modal */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-3xl p-10 max-w-md mx-4 text-center shadow-2xl animate-scale-in border-4 border-[#c9424a]/60">
            <div className="mb-8 relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#c9424a] via-[#a0353b] to-[#4a181b] rounded-full flex items-center justify-center animate-pulse-scale shadow-2xl">
                <Sparkles className="h-16 w-16 text-white animate-spin-slow" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-4 border-[#c9424a]/60 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-[#c9424a] to-[#a0353b] bg-clip-text text-transparent mb-4">
              Generating Image
            </h3>
            <p className="text-xl font-semibold text-[#4a181b] mb-2">
              कृपया प्रतीक्षा करें...
            </p>
            <p className="text-lg text-[#a0353b] mb-6">
              Please wait, creating magic ✨
            </p>
            <div className="flex gap-3 justify-center">
              <div className="w-4 h-4 bg-[#c9424a] rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }}></div>
              <div className="w-4 h-4 bg-[#a0353b] rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }}></div>
              <div className="w-4 h-4 bg-[#c9424a] rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto space-y-6 relative z-10 pb-20">
        {/* Main Form Card */}
        {!imageSrc && (
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-lg animate-slide-up overflow-hidden rounded-3xl mt-8">
          <CardContent className="p-6 space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9424a] to-[#e06b72] p-[2px] shadow-lg">
              <div className="rounded-2xl bg-gradient-to-r from-[#fff7f7] to-[#fff0f0] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9424a] to-[#e06b72] flex items-center justify-center shadow-md">
                      <Zap className="h-5 w-5 text-white fill-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#a0353b] uppercase tracking-wide leading-none mb-0.5">
                        {!walletEnabled
                          ? "✨ Wallet paused — all free"
                          : starterFreeAiLeft > 0
                            ? "🎁 Starter free AI"
                            : "💰 Paid AI image"}
                      </p>
                      <p className="text-[11px] text-[#c9424a]/70 leading-none">
                        {!walletEnabled
                          ? "Post / reel / AI: no coin charges until admin enables wallet"
                          : `After ${starterFreeAiTotal} free: ${reelsRequired} reels → paid AI (${paidAiCoins} coins)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    {walletEnabled && starterFreeAiLeft > 0 && (
                      <span className="bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm mb-1">
                        FREE SLOT
                      </span>
                    )}
                    <span className="text-base font-extrabold text-[#c9424a] leading-tight">
                      {walletEnabled ? (
                        <>
                          {paidAiCoins}{" "}
                          <span className="text-xs font-semibold">coins / AI</span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold">0 coins</span>
                      )}
                    </span>
                    {walletEnabled && (
                      <span className="text-[10px] text-[#a0353b]/60 leading-none mt-0.5">
                        Earn: reel +2 · post to feed +1 (free)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Character Image Upload */}
            <div className="space-y-4">
              <Label className="text-lg font-bold flex items-center gap-2 text-[#2d0f11]">
                <div className="w-8 h-8 bg-gradient-to-br from-[#c9424a] to-[#a0353b] rounded-lg flex items-center justify-center shadow-md">
                  <Image className="h-5 w-5 text-white" />
                </div>
                Face Picture
                <span className="text-xs text-[#a0353b] font-semibold bg-[#c9424a]/10 px-2 py-0.5 rounded-full">Required</span>
              </Label>
              
              {!characterImage ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-40 h-40 rounded-full border-4 border-dashed border-[#c9424a]/60 bg-[#c9424a]/5 flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-[#c9424a] mx-auto mb-2" />
                      <p className="text-xs text-[#c9424a] font-medium">Preview</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={() => document.getElementById("gallery-input")?.click()}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-[#c9424a]/60 rounded-2xl bg-gradient-to-br from-[#c9424a]/5 to-[#c9424a]/10 hover:from-[#c9424a]/10 hover:to-[#c9424a]/20 transition-all active:scale-95 shadow-md"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#c9424a] flex items-center justify-center shadow-lg">
                        <FolderOpen className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-bold text-[#4a181b]">Gallery</span>
                    </button>
                    
                    <button
                      onClick={openCamera}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-[#c9424a]/60 rounded-2xl bg-gradient-to-br from-[#c9424a]/5 to-[#c9424a]/10 hover:from-[#c9424a]/10 hover:to-[#c9424a]/20 transition-all active:scale-95 shadow-md"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#c9424a] flex items-center justify-center shadow-lg">
                        <CameraIcon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-bold text-[#4a181b]">Selfie</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#c9424a] shadow-xl animate-scale-in">
                      <img 
                        src={characterImage} 
                        alt="Character" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={removeCharacterImage}
                      className="absolute top-0 right-0 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={() => document.getElementById("gallery-input")?.click()}
                      className="flex items-center justify-center gap-2 p-3 border-2 border-[#c9424a]/60 rounded-xl bg-white hover:bg-[#c9424a]/5 transition-all text-sm font-semibold text-[#4a181b] shadow-sm"
                    >
                      <FolderOpen className="h-4 w-4 text-[#c9424a]" />
                      Change
                    </button>
                    
                    <button
                      onClick={openCamera}
                      className="flex items-center justify-center gap-2 p-3 border-2 border-[#c9424a]/60 rounded-xl bg-white hover:bg-[#c9424a]/5 transition-all text-sm font-semibold text-[#4a181b] shadow-sm"
                    >
                      <CameraIcon className="h-4 w-4 text-[#c9424a]" />
                      Retake
                    </button>
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

            {/* Uniform Toggle & Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#c9424a]/5 to-[#c9424a]/10 rounded-xl border border-[#c9424a]/30 shadow-sm">
                <input 
                  type="checkbox" 
                  id="useUniform"
                  checked={useUniform}
                  onChange={(e) => setUseUniform(e.target.checked)}
                  className="w-5 h-5 rounded border-[#c9424a]/50 text-[#a0353b] focus:ring-[#c9424a]"
                />
                <Label htmlFor="useUniform" className="text-sm font-semibold text-[#4a181b] flex-1 cursor-pointer">
                  Add Uniform / Dress Reference
                  <span className="block text-xs text-[#c9424a] font-normal">Optional</span>
                </Label>
              </div>
              
              {useUniform && (
                <div className="animate-fade-in">
                  {!uniformImageSrc ? (
                    <div 
                      onClick={() => document.getElementById("uniform-input")?.click()}
                      className="relative h-28 border-2 border-dashed border-[#c9424a]/60 rounded-2xl flex flex-col items-center justify-center bg-[#c9424a]/5 hover:bg-[#c9424a]/10 transition-all cursor-pointer group mt-2 shadow-inner"
                    >
                      <div className="relative flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#c9424a] shadow-md flex items-center justify-center group-hover:scale-110 transition-transform text-white">
                          <Plus className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-[#4a181b]">Add Uniform</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="h-40 rounded-2xl overflow-hidden border-2 border-[#c9424a] shadow-lg animate-scale-in">
                        <img 
                          src={uniformImageSrc} 
                          alt="Uniform" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={removeUniformImage}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg z-10"
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
                  />
                </div>
              )}
            </div>

            {/* Single Unified Prompt Dropdown */}
            <div className="space-y-3">
              <Label htmlFor="prompt-dropdown" className="text-lg font-bold flex items-center gap-2 text-[#2d0f11]">
                <div className="w-8 h-8 bg-gradient-to-br from-[#c9424a] to-[#e06b72] rounded-lg flex items-center justify-center shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                Select Style Prompt
              </Label>
              <div className="relative">
                <select
                  id="prompt-dropdown"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value)
                    setManualPrompt("")
                  }}
                  className="w-full h-14 text-base font-medium border-2 border-[#c9424a]/30 focus:border-[#c9424a] rounded-xl shadow-sm transition-all px-4 pr-10 bg-white appearance-none cursor-pointer"
                >
                  <option value="">-- Select a Style --</option>
                  {allPrompts.map((category) => (
                    <optgroup key={category.category} label={category.category}>
                      {category.prompts.map((prompt, idx) => (
                        <option key={idx} value={prompt.en}>{prompt.en} | {prompt.hi}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#e06b72] pointer-events-none" />
              </div>
            </div>

            {/* Write Your Own Prompt - Enhanced with Voice Input */}
            <div className="space-y-3">
              <Label htmlFor="manual-prompt" className="text-lg font-bold flex items-center gap-2 text-[#2d0f11]">
                <div className="w-8 h-8 bg-gradient-to-br from-[#c9424a] to-[#e06b72] rounded-lg flex items-center justify-center shadow-md">
                  <Edit className="h-5 w-5 text-white" />
                </div>
                Write Your Own Prompt
              </Label>
              
              <div className="relative">
                <textarea
                  id="manual-prompt"
                  value={manualPrompt}
                  onChange={(e) => {
                    setManualPrompt(e.target.value)
                    if (e.target.value.trim()) setTopic("")
                  }}
                  placeholder="अपना खुद का prompt लिखें... (e.g., नीली साड़ी में खूबसूरत लड़की)"
                  className="w-full min-h-28 resize-none text-base font-medium border-2 border-[#c9424a]/30 focus:border-[#c9424a] rounded-xl p-4 pr-16 transition-all shadow-sm"
                />
                
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all ${
                    isListening 
                      ? "bg-red-500 animate-pulse" 
                      : "bg-[#c9424a] hover:bg-[#a0353b]"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5 text-white" />
                  ) : (
                    <Mic className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
              
              {/* Voice status indicator */}
              {isListening && (
                <div className="flex items-center gap-2 text-sm text-[#c9424a] font-medium animate-pulse">
                  <span className="w-2 h-2 bg-[#c9424a] rounded-full animate-ping"></span>
                  Listening... Speak now
                </div>
              )}
              
              <p className="text-xs text-[#c9424a] italic">
                💡 Tip: Click the mic button and speak, or type your prompt
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!topic && !manualPrompt.trim()) || !characterImage}
              className="w-full h-16 gap-3 text-xl font-bold bg-gradient-to-r from-[#a0353b] via-[#7d292e] to-[#4a181b] hover:from-[#7d292e] hover:via-[#4a181b] hover:to-[#2d0f11] transition-all shadow-xl hover:shadow-[#c9424a]/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-xl mt-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="animate-pulse">Creating Magic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-6 w-6" />
                  Generate AI Image (
                  {!walletEnabled
                    ? "free"
                    : starterFreeAiLeft > 0
                      ? "starter free"
                      : `${paidAiCoins} coins`}
                  )
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Generated Image Preview & Actions */}
        {imageSrc && !showEditForm && (
          <Card className="border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-lg animate-scale-in rounded-3xl">
            <CardContent className="p-0">
              {/* Generated Image */}
              <div className="relative group bg-gray-50">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button onClick={() => setShowFullView(true)} className="p-2 bg-black/50 hover:bg-[#c9424a] text-white rounded-full backdrop-blur-md transition-all shadow-lg">
                    <Maximize2 className="h-5 w-5" />
                  </button>
                  <button onClick={clearAllData} className="p-2 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all shadow-lg">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <img
                  src={imageSrc}
                  alt="Generated AI Image"
                  className="w-full h-auto max-h-[75vh] object-contain"
                />
              </div>

              {/* Full View Modal */}
              <Dialog open={showFullView} onOpenChange={setShowFullView}>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/90 border-none sm:max-w-fit focus:outline-none">
                  <DialogTitle className="sr-only">View Generated Image</DialogTitle>
                  <div className="relative flex items-center justify-center h-full max-h-[90vh] w-full p-2">
                    <img src={imageSrc} alt="Generated Full" className="max-h-[85vh] w-auto object-contain rounded-md" />
                    <button 
                      onClick={() => setShowFullView(false)}
                      className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Action Buttons */}
              <div className="p-6 bg-gradient-to-br from-[#c9424a]/5 to-[#c9424a]/10">
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#c9424a]/60 rounded-2xl hover:bg-[#c9424a]/5 transition-all active:scale-95 shadow-md"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9424a] to-[#a0353b] flex items-center justify-center shadow-lg">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-bold text-[#4a181b]">Share</span>
                  </button>

                  <button
                    onClick={handleEdit}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#c9424a]/60 rounded-2xl hover:bg-[#c9424a]/5 transition-all active:scale-95 shadow-md"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9424a] to-[#a0353b] flex items-center justify-center shadow-lg">
                      <Edit className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-bold text-[#4a181b]">Edit</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#c9424a]/60 rounded-2xl hover:bg-[#c9424a]/5 transition-all active:scale-95 shadow-md"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9424a] to-[#e06b72] flex items-center justify-center shadow-lg">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-bold text-[#4a181b]">Download</span>
                  </button>
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#c9424a]/60 rounded-2xl hover:bg-[#c9424a]/5 transition-all active:scale-95 shadow-md"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9424a] to-[#e06b72] flex items-center justify-center shadow-lg">
                      <Send className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-bold text-[#4a181b]">Post</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post Form - Simple Version */}
        {showPostForm && imageSrc && (
          <Card className="border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-lg animate-scale-in rounded-3xl">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[#2d0f11] flex items-center gap-2">
                  <Send className="h-6 w-6 text-[#c9424a]" />
                  Finalize Post
                </h3>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="p-2 hover:bg-[#c9424a]/5 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-[#c9424a]" />
                </button>
              </div>

              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#c9424a]/30 flex-shrink-0">
                  <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="post-caption" className="text-sm font-bold text-[#4a181b]">
                    Caption
                  </Label>
                  <textarea
                    id="post-caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    className="w-full h-20 resize-none text-sm border-2 border-[#c9424a]/30 focus:border-[#c9424a] rounded-xl p-2 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-tags" className="text-sm font-bold text-[#4a181b]">
                  Tags (comma separated)
                </Label>
                <Input
                  id="post-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="#art, #ai, #fashion"
                  className="h-12 text-sm border-2 border-[#c9424a]/30 focus:border-[#c9424a] rounded-xl px-4"
                />
              </div>

              <Button 
                onClick={handlePost} 
                disabled={isPosting} 
                className="w-full h-14 gap-3 text-lg font-bold bg-gradient-to-r from-[#c9424a] to-[#e06b72] hover:from-[#a0353b] hover:to-[#c9424a] transition-all shadow-lg hover:scale-105 rounded-xl"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    Share to Feed 🚀
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Form */}
        {showEditForm && imageSrc && (
          <Card className="border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-lg animate-scale-in rounded-3xl">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#2d0f11] flex items-center gap-2">
                  <Edit className="h-6 w-6 text-[#c9424a]" />
                  Edit Prompt
                </h3>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="p-2 hover:bg-[#c9424a]/5 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-[#c9424a]" />
                </button>
              </div>

              {/* Current Image Preview */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-[#c9424a]/30">
                <img src={imageSrc} alt="Current" className="w-full h-full object-cover" />
              </div>

              {/* Edit Prompts */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-[#4a181b]">Select Style</Label>
                  <div className="relative">
                    <select
                      value={topic}
                      onChange={(e) => {
                        setTopic(e.target.value)
                        setManualPrompt("")
                      }}
                      className="w-full h-12 text-sm font-medium border-2 border-[#c9424a]/30 focus:border-[#c9424a] rounded-xl px-3 pr-10 bg-white appearance-none"
                    >
                      <option value="">-- Select --</option>
                      {allPrompts.map((category) => (
                        <optgroup key={category.category} label={category.category}>
                          {category.prompts.map((prompt, idx) => (
                            <option key={idx} value={prompt.en}>{prompt.hi} | {prompt.en}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#e06b72] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-[#4a181b]">Or Write Custom Prompt</Label>
                  <div className="relative">
                    <textarea
                      value={manualPrompt}
                      onChange={(e) => {
                        setManualPrompt(e.target.value)
                        if (e.target.value.trim()) setTopic("")
                      }}
                      placeholder="अपना prompt लिखें... (Speak or type)"
                      className="w-full min-h-20 resize-none text-sm border-2 border-[#c9424a]/30 focus:border-[#c9424a] rounded-xl p-3 pr-12"
                    />
                    <button
                      type="button"
                      onClick={isListening ? stopVoiceInput : startVoiceInput}
                      className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${
                        isListening 
                          ? "bg-red-500 animate-pulse" 
                          : "bg-[#c9424a] hover:bg-[#a0353b]"
                      }`}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4 text-white" />
                      ) : (
                        <Mic className="h-4 w-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Regenerate Button */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowEditForm(false)}
                  variant="outline"
                  className="h-14 text-base font-bold border-2 border-[#c9424a]/30 hover:bg-[#c9424a]/5 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!topic && !manualPrompt.trim())}
                  className="h-14 gap-2 text-base font-bold bg-gradient-to-r from-[#a0353b] to-[#7d292e] hover:from-[#7d292e] hover:to-[#4a181b] transition-all shadow-lg rounded-xl"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Regenerate (
                      {!walletEnabled
                        ? "free"
                        : starterFreeAiLeft > 0
                          ? "starter free"
                          : `${paidAiCoins} coins`}
                      )
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

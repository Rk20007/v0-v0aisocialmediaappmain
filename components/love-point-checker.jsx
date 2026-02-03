"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"

const calculateLovePoints = (name1, name2) => {
  const combined = (name1 + name2).toLowerCase()
  let hash = 0

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  const percentage = Math.abs(hash % 76) + 25
  return percentage
}

const getLoveMessage = (percentage) => {
  if (percentage >= 90) return "🔥 Absolutely Perfect! 🔥"
  if (percentage >= 80) return "💕 True Love! 💕"
  if (percentage >= 70) return "💖 Great Match! 💖"
  if (percentage >= 60) return "💘 Good Chemistry! 💘"
  if (percentage >= 50) return "🧡 Possible Match 🧡"
  if (percentage >= 40) return "💛 Worth a Try 💛"
  return "💔 Maybe Not 💔"
}

export default function LovePointChecker() {
  const [name1, setName1] = useState("")
  const [name2, setName2] = useState("")
  const [loveScore, setLoveScore] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleCheck = () => {
    if (name1.trim() && name2.trim()) {
      setIsAnimating(true)
      setTimeout(() => {
        const score = calculateLovePoints(name1, name2)
        setLoveScore(score)
        setIsAnimating(false)
      }, 1500)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && name1.trim() && name2.trim()) {
      handleCheck()
    }
  }

  const shareToWhatsApp = () => {
    const text = `💕 Love Point Check 💕\n\n${name1} ❤️ ${name2}\n\nLove Score: ${loveScore}%\n${getLoveMessage(loveScore)}\n\nCheck yours too! 🧡✨`
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encoded}`, "_blank")
  }

  const shareToInstagram = () => {
    const text = `💕 My Love Score: ${loveScore}%! ${getLoveMessage(loveScore)} 🧡✨\n\n${name1} ❤️ ${name2}\n\nCheck your love compatibility! #LovePointChecker #LoveCompatibility`
    alert("Copy this text and share on Instagram Stories or Posts:\n\n" + text)
  }

  const shareToFacebook = () => {
    const text = `💕 Love Point Check 💕\n\n${name1} ❤️ ${name2}\n\nLove Score: ${loveScore}%\n${getLoveMessage(loveScore)}\n\nCheck your love compatibility!`
    const encoded = encodeURIComponent(text)
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encoded}`, "_blank")
  }

  const shareLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert("Link copied to clipboard! 📋")
  }

  const reset = () => {
    setLoveScore(null)
    setName1("")
    setName2("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex items-start justify-center px-4 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(1); }
          75% { transform: scale(1.1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .heart-beat {
          animation: heartBeat 1.2s infinite;
        }

        .float-animation {
          animation: float 3s ease-in-out infinite;
        }

        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }

        .pulse-animation {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .progress-ring {
          transition: stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div className="w-full max-w-lg">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-5xl heart-beat">💕</span>
            <h1 className="text-4xl font-bold text-gray-900">Love Point Checker</h1>
            <span className="text-5xl heart-beat" style={{ animationDelay: '0.3s' }}>💕</span>
          </div>
          <p className="text-gray-700 text-lg font-medium">Check your love compatibility!</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[2rem] shadow-xl p-8 mb-6">
          <div className="space-y-5">
            {/* Name 1 Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="name"
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-[1.5rem] focus:outline-none focus:border-pink-400 text-gray-900 font-medium text-lg transition-all placeholder:text-gray-400"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl pointer-events-none">💕</span>
            </div>

            {/* Heart Divider */}
            <div className="flex items-center justify-center py-1">
              <span className="text-4xl heart-beat">❤️</span>
            </div>

            {/* Name 2 Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="partner name"
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-[1.5rem] focus:outline-none focus:border-orange-400 text-gray-900 font-medium text-lg transition-all placeholder:text-gray-400"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl pointer-events-none">🧡</span>
            </div>

            {/* Check Button - Only show when no score */}
            {!loveScore && !isAnimating && (
              <button
                onClick={handleCheck}
                disabled={!name1.trim() || !name2.trim()}
                className="w-full mt-4 bg-gradient-to-r from-orange-400 to-yellow-400 text-white font-bold py-4 rounded-[1.5rem] transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-lg disabled:hover:scale-100"
              >
                ✨ Check Love Points
              </button>
            )}
          </div>
        </div>

        {/* Loading Animation */}
        {isAnimating && (
          <div className="text-center mb-6 slide-up">
            <div className="inline-flex flex-col items-center bg-white rounded-[2rem] shadow-xl px-16 py-10">
              <div className="flex gap-4 mb-4">
                <span className="text-5xl pulse-animation">❤️</span>
                <span className="text-5xl pulse-animation" style={{ animationDelay: "0.3s" }}>🧡</span>
                <span className="text-5xl pulse-animation" style={{ animationDelay: "0.6s" }}>💛</span>
              </div>
              <p className="text-gray-700 font-semibold text-lg">Calculating love...</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {loveScore !== null && !isAnimating && (
          <div className="space-y-6 slide-up">
            {/* Score Card */}
            <div className="bg-white rounded-[2rem] shadow-xl p-8">
              {/* Circular Progress */}
              <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="#FEF3C7"
                      strokeWidth="14"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="14"
                      strokeDasharray={`${(loveScore / 100) * 552.92} 552.92`}
                      strokeLinecap="round"
                      className="progress-ring"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl mb-2 float-animation">💕</span>
                    <p className="text-6xl font-bold text-gray-900">{loveScore}%</p>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Compatibility</p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-5">
                {getLoveMessage(loveScore)}
              </h3>

              {/* Names Display */}
              <div className="flex items-center justify-center gap-2 text-lg font-bold mb-6">
                <span className="text-gray-900">{name1}</span>
                <span className="text-red-500">❤️</span>
                <span className="text-gray-900">{name2}</span>
              </div>

              {/* Fun Message */}
              <div className="bg-purple-50 rounded-2xl p-5 mb-6">
                <p className="text-sm text-gray-700 text-center font-medium leading-relaxed">
                  💭 {loveScore >= 80
                    ? "You two are destined to be together! Make this moment count!"
                    : loveScore >= 60
                      ? "Great potential! Keep the spark alive and see where it goes!"
                      : loveScore >= 40
                        ? "There's a chance! Give it your best effort and find the magic!"
                        : "Maybe focus on being great friends first!"}
                </p>
              </div>

              {/* Try Again Button */}
              <button
                onClick={reset}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-2xl transition-all text-base"
              >
                Try Again ↻
              </button>
            </div>

            {/* Share Card */}
            <div className="bg-white rounded-[2rem] shadow-xl p-7">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Your Results!
              </h3>

              <div className="grid grid-cols-4 gap-3">
                {/* WhatsApp */}
                <button
                  onClick={shareToWhatsApp}
                  className="aspect-square bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl transition-all flex items-center justify-center hover:bg-gray-50"
                  title="Share on WhatsApp"
                >
                  <span className="text-3xl">💬</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={shareToFacebook}
                  className="aspect-square bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl transition-all flex items-center justify-center hover:bg-gray-50"
                  title="Share on Facebook"
                >
                  <span className="text-3xl">📘</span>
                </button>

                {/* Instagram */}
                <button
                  onClick={shareToInstagram}
                  className="aspect-square bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl transition-all flex items-center justify-center hover:bg-gray-50"
                  title="Share on Instagram"
                >
                  <span className="text-3xl">📷</span>
                </button>

                {/* Copy Link */}
                <button
                  onClick={shareLink}
                  className="aspect-square bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl transition-all flex items-center justify-center hover:bg-gray-50"
                  title="Copy Link"
                >
                  <span className="text-3xl">🔗</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-5 font-medium leading-relaxed">
                Share the love! Let your friends check their compatibility too! 💕
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loveScore && !isAnimating && (!name1 || !name2) && (
          <div className="text-center mt-12 slide-up">
            <div className="mb-6 float-animation">
              <span className="text-8xl">💕</span>
            </div>
            <p className="text-gray-800 font-semibold text-xl leading-relaxed">
              Enter your name and your crush's name<br />to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
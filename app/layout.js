import { Poppins, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata = {
  title: "Colorcode - AI Social Network",
  description: "Create amazing AI-generated images and connect with friends",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Colorcode",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Colorcode - AI Social Network",
    description: "Create amazing AI-generated images and connect with friends",
    type: "website",
  },
    generator: 'v0.app'
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FF6B6B",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.jpg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.jpg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Colorcode" />
        <meta name="msapplication-TileColor" content="#FF6B6B" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${poppins.variable} ${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}

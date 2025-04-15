import type React from "react"
import { ToastProvider } from "@/lib/toast-provider"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
          <ToastProvider />
          {children}
      </body>
    </html>
  )
}

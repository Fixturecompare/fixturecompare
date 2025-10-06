import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'

// Load fonts as CSS variables for Tailwind to reference
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })
const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', variable: '--font-montserrat' })

export const metadata: Metadata = {
  title: 'Fixture Compare - Premium Sports App',
  description: 'Compare sports fixtures with premium design and smooth animations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Attach font variables and use Tailwind base font */}
      <body className={`${inter.variable} ${montserrat.variable} font-sans`}>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
          {children}
        </div>
      </body>
    </html>
  )
}

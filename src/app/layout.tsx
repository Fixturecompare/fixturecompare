import type { Metadata } from 'next'
import { Inter, Montserrat, Poppins, Darker_Grotesque } from 'next/font/google'
import './globals.css'

// Load fonts as CSS variables for Tailwind to reference
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })
const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', variable: '--font-montserrat' })
const poppins = Poppins({ subsets: ['latin'], weight: ['400','500','600','700'], display: 'swap', variable: '--font-poppins' })
const darkerGrotesque = Darker_Grotesque({ subsets: ['latin'], weight: ['400','600','700'], display: 'swap', variable: '--font-darker' })

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
      {/* Attach font variables and use Tailwind base font (now Poppins-first) */}
      <body className={`${inter.variable} ${montserrat.variable} ${poppins.variable} ${darkerGrotesque.variable} font-sans`}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}

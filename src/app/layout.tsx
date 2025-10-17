import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import ConditionalNavbar from '@/components/layout/ConditionalNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Website Builder - Create Websites with MediaWiki',
  description: 'Build beautiful websites instantly with our visual editor, powered by MediaWiki backend.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ConditionalNavbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
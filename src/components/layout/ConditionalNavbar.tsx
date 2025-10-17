'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function ConditionalNavbar() {
  const pathname = usePathname()
  
  // Don't show navbar on user website pages (routes like /[username] or /[username]/[page])
  // Also don't show on edit pages
  const isUserWebsitePage = pathname && (
    pathname.match(/^\/[^\/]+$/) || // matches /username
    pathname.match(/^\/[^\/]+\/[^\/]+$/) || // matches /username/page
    pathname.match(/^\/[^\/]+\/edit$/) // matches /username/edit
  )
  
  // Don't show navbar on user website pages
  if (isUserWebsitePage) {
    return null
  }
  
  return <Navbar />
}

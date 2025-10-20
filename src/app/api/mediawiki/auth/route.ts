import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkMediaWikiAuth, getMediaWikiUserInfo } from '@/lib/mediawiki-visualeditor'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        error: 'Not logged in to Next.js app' 
      }, { status: 401 })
    }

    // Check MediaWiki authentication
    const isAuthenticated = await checkMediaWikiAuth()
    
    if (!isAuthenticated) {
      return NextResponse.json({ 
        authenticated: false,
        requiresMediaWikiAuth: true,
        message: 'Not authenticated with MediaWiki'
      })
    }

    // Get MediaWiki user info
    const userInfo = await getMediaWikiUserInfo()
    
    return NextResponse.json({
      authenticated: true,
      user: userInfo,
      message: 'Successfully authenticated with MediaWiki'
    })
  } catch (error) {
    console.error('Error checking MediaWiki auth:', error)
    return NextResponse.json({ 
      authenticated: false,
      error: 'Failed to check authentication status' 
    }, { status: 500 })
  }
}

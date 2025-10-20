import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getPageContentViaAPI, 
  savePageContentViaAPI,
  checkMediaWikiAuth 
} from '@/lib/mediawiki-visualeditor'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  try {
    const { title } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is authenticated with MediaWiki
    const isAuthenticated = await checkMediaWikiAuth()
    if (!isAuthenticated) {
      return NextResponse.json({ 
        error: 'Not authenticated with MediaWiki',
        requiresAuth: true 
      }, { status: 401 })
    }

    // Get page content
    const pageContent = await getPageContentViaAPI(title)
    
    if (!pageContent) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(pageContent)
  } catch (error) {
    console.error('Error getting page content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  try {
    const { title } = await params
    const { content, comment } = await request.json()
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is authenticated with MediaWiki
    const isAuthenticated = await checkMediaWikiAuth()
    if (!isAuthenticated) {
      return NextResponse.json({ 
        error: 'Not authenticated with MediaWiki',
        requiresAuth: true 
      }, { status: 401 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Save page content
    const result = await savePageContentViaAPI(title, content, comment || 'VisualEditor edit')
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to save page' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      newrevid: result.newrevid 
    })
  } catch (error) {
    console.error('Error saving page content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

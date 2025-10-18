import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getPageInfo,
  getPageHistory,
  getRevisionContent,
  getPageFiles,
  getFileInfo,
  getPageCategories,
  addPageCategories,
  getPageTemplates,
  searchPages,
  getRecentChanges,
  getUserInfo,
  addToWatchlist,
  getWatchlist,
  setPageProtection,
  getPageProtection,
  getAllCategories,
  getAllTemplates,
  getWikiStats
} from '@/lib/mediawiki-comprehensive'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'info'

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the site
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Check if the user is the owner of the site
    if (site.userId !== session.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the page
    const page = await prisma.page.findUnique({
      where: { id: pageId }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    let result: any = {}

    switch (action) {
      case 'info':
        result = await getPageInfo(page.title, site.wikiUrl)
        break
      
      case 'history':
        const limit = parseInt(searchParams.get('limit') || '50')
        result = await getPageHistory(page.title, limit, site.wikiUrl)
        break
      
      case 'files':
        result = await getPageFiles(page.title, site.wikiUrl)
        break
      
      case 'categories':
        result = await getPageCategories(page.title, site.wikiUrl)
        break
      
      case 'templates':
        result = await getPageTemplates(page.title, site.wikiUrl)
        break
      
      case 'protection':
        result = await getPageProtection(page.title, site.wikiUrl)
        break
      
      case 'watchlist':
        result = await getWatchlist(site.wikiUrl)
        break
      
      case 'recent-changes':
        const rcLimit = parseInt(searchParams.get('limit') || '50')
        result = await getRecentChanges(rcLimit, site.wikiUrl)
        break
      
      case 'search':
        const query = searchParams.get('q')
        const searchLimit = parseInt(searchParams.get('limit') || '20')
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
        }
        result = await searchPages(query, searchLimit, site.wikiUrl)
        break
      
      case 'all-categories':
        const catLimit = parseInt(searchParams.get('limit') || '500')
        result = await getAllCategories(catLimit, site.wikiUrl)
        break
      
      case 'all-templates':
        const templateLimit = parseInt(searchParams.get('limit') || '500')
        result = await getAllTemplates(templateLimit, site.wikiUrl)
        break
      
      case 'stats':
        result = await getWikiStats(site.wikiUrl)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in comprehensive page API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params
    const { action, ...data } = await request.json()

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the site
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Check if the user is the owner of the site
    if (site.userId !== session.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the page
    const page = await prisma.page.findUnique({
      where: { id: pageId }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    let result: any = {}

    switch (action) {
      case 'add-categories':
        const { categories, comment } = data
        result = await addPageCategories(page.title, categories, comment, site.wikiUrl)
        break
      
      case 'add-to-watchlist':
        result = await addToWatchlist(page.title, site.wikiUrl)
        break
      
      case 'set-protection':
        const { protections, expiry, reason } = data
        result = await setPageProtection(page.title, protections, expiry, reason, site.wikiUrl)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: result })
  } catch (error) {
    console.error('Error in comprehensive page API POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

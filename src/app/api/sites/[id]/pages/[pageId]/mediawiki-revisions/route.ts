import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPageHistoryFromMediaWiki, getRevisionContentFromMediaWiki } from '@/lib/mediawiki-real'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params
    const { searchParams } = new URL(request.url)
    const revid = searchParams.get('revid')
    const limit = parseInt(searchParams.get('limit') || '50')

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

        // Get revisions from MediaWiki, fallback to local
        try {
          console.log(`[MEDIAWIKI REVISIONS] Fetching history for page: ${page.title}`)

          const mediawikiHistory = await getPageHistoryFromMediaWiki(page.title, limit)
          console.log(`[MEDIAWIKI REVISIONS] Found ${mediawikiHistory.length} MediaWiki revisions`)

          // If no MediaWiki revisions, get local revisions
          let localRevisions = []
          if (mediawikiHistory.length === 0) {
            console.log(`[MEDIAWIKI REVISIONS] No MediaWiki revisions, getting local revisions`)
            localRevisions = await prisma.pageRevision.findMany({
              where: { pageId },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: limit
            })
            console.log(`[MEDIAWIKI REVISIONS] Found ${localRevisions.length} local revisions`)
          }

          return NextResponse.json({
            mediawikiHistory: mediawikiHistory || [],
            localRevisions: localRevisions || [],
            totalRevisions: (mediawikiHistory?.length || 0) + (localRevisions?.length || 0)
          })
        } catch (error) {
          console.error('Error getting MediaWiki revisions:', error)
          return NextResponse.json({ error: 'Failed to get revisions' }, { status: 500 })
        }
  } catch (error) {
    console.error('Error in MediaWiki revisions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params
    const { action, revid, content, comment } = await request.json()

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

    // Restore revision from local database or MediaWiki
    try {
      if (action === 'restore' && revid) {
        console.log(`[RESTORE] Restoring revision: ${revid}`)
        
        let revisionContent = ''
        
        // Check if it's a MediaWiki revision
        if (revid.toString().startsWith('mw-')) {
          const mediawikiRevId = parseInt(revid.toString().replace('mw-', ''))
          console.log(`[RESTORE] MediaWiki revision ID: ${mediawikiRevId}`)
          
          revisionContent = await getRevisionContentFromMediaWiki(mediawikiRevId)
          
          if (!revisionContent) {
            return NextResponse.json({ error: 'Revision not found in MediaWiki' }, { status: 404 })
          }
        } else {
          // Local revision
          console.log(`[RESTORE] Local revision ID: ${revid}`)
          
          const revision = await prisma.pageRevision.findUnique({
            where: { id: revid }
          })
          
          if (!revision) {
            return NextResponse.json({ error: 'Revision not found in local database' }, { status: 404 })
          }
          
          revisionContent = revision.content
        }

        // Update page content in local database
        await prisma.page.update({
          where: { id: pageId },
          data: { content: revisionContent }
        })

        return NextResponse.json({
          success: true,
          content: revisionContent,
          message: `Restored to revision ${revid}`
        })
      } else {
        return NextResponse.json({ error: 'Invalid action or missing revision ID' }, { status: 400 })
      }
    } catch (error) {
      console.error('Error restoring revision:', error)
      return NextResponse.json({ error: 'Failed to restore revision' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in MediaWiki revisions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
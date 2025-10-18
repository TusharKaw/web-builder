import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPageHistory, getRevisionContent } from '@/lib/mediawiki-comprehensive'

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

    let result: any = {}

    if (revid) {
      // Get specific revision content
      result = await getRevisionContent(parseInt(revid), site.wikiUrl)
    } else {
      // Get page history from MediaWiki
      const mediawikiHistory = await getPageHistory(page.title, limit, site.wikiUrl)
      
      // Get local revisions
      const localRevisions = await prisma.pageRevision.findMany({
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

      result = {
        mediawikiHistory,
        localRevisions
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching MediaWiki revisions:', error)
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

    let result: any = {}

    switch (action) {
      case 'restore':
        if (!revid) {
          return NextResponse.json({ error: 'Revision ID required' }, { status: 400 })
        }
        
        // Get revision content from MediaWiki
        const revisionContent = await getRevisionContent(revid, site.wikiUrl)
        
        if (!revisionContent) {
          return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
        }

        // Update page content
        await prisma.page.update({
          where: { id: pageId },
          data: { content: revisionContent }
        })

        // Create new revision record
        const newRevision = await prisma.pageRevision.create({
          data: {
            content: revisionContent,
            comment: comment || `Restored to MediaWiki revision ${revid}`,
            isMinor: false,
            pageId,
            userId: session.user.id
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        result = newRevision
        break
      
      case 'sync':
        // Sync local revisions with MediaWiki
        const mediawikiHistory = await getPageHistory(page.title, 50, site.wikiUrl)
        
        // Create local revision records for MediaWiki revisions that don't exist locally
        for (const revision of mediawikiHistory) {
          const existingRevision = await prisma.pageRevision.findFirst({
            where: {
              pageId,
              content: revision.content
            }
          })

          if (!existingRevision) {
            await prisma.pageRevision.create({
              data: {
                content: revision.content,
                comment: revision.comment || 'Synced from MediaWiki',
                isMinor: revision.minor || false,
                pageId,
                userId: session.user.id
              }
            })
          }
        }

        result = { synced: mediawikiHistory.length }
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in MediaWiki revisions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

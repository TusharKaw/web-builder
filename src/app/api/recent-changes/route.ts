import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch platform data only (no external MediaWiki feed)
    const [recentSites, recentRevisions] = await Promise.all([
      prisma.site.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          subdomain: true,
          createdAt: true,
          user: { select: { name: true, email: true } }
        }
      }),
      prisma.pageRevision.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          comment: true,
          isMinor: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          page: {
            select: {
              title: true,
              site: { select: { subdomain: true } }
            }
          }
        }
      })
    ])

    // Map to UI-compatible shapes
    const createWikiLogs = recentSites.map((s) => ({
      title: s.name || s.subdomain,
      timestamp: s.createdAt.toISOString(),
      user: s.user?.name || s.user?.email || 'Unknown',
      comment: `Website created: ${s.subdomain}`,
      logtype: 'site',
      action: 'create'
    }))

    const recentChanges = recentRevisions.map((r) => ({
      type: 'edit',
      ns: 0,
      title: `${r.page?.site?.subdomain || 'site'}/${r.page?.title || 'Page'}`,
      revid: undefined,
      old_revid: undefined,
      rcid: undefined,
      timestamp: r.createdAt.toISOString(),
      user: r.user?.name || r.user?.email || 'Unknown',
      comment: r.comment || (r.isMinor ? 'Minor edit' : 'Edit'),
      logtype: undefined,
      logaction: undefined
    }))

    return NextResponse.json({ recentChanges, createWikiLogs })
  } catch (error) {
    console.error('Error in recent changes API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



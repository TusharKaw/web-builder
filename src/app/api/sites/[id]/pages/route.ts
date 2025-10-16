import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listPages, savePage, getEditToken } from '@/lib/mediawiki'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const site = await prisma.site.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Get pages from MediaWiki
    const wikiPages = await listPages(site.wikiUrl)
    
    // Get local page records
    const localPages = await prisma.page.findMany({
      where: { siteId: id }
    })

    // Merge wiki pages with local records
    const pages = wikiPages.map((title: string) => {
      const localPage = localPages.find((p: any) => p.title === title)
      return {
        title,
        slug: localPage?.slug || title.toLowerCase().replace(/\s+/g, '-'),
        content: localPage?.content || '',
        isPublished: localPage?.isPublished || false,
        createdAt: localPage?.createdAt || new Date(),
        updatedAt: localPage?.updatedAt || new Date()
      }
    })

    return NextResponse.json(pages)
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { title, content, slug } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const site = await prisma.site.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Save to MediaWiki
    const token = await getEditToken(site.wikiUrl)
    await savePage(title, content || '', token, site.wikiUrl)

    // Save to local database
    const page = await prisma.page.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        content: content || '',
        siteId: id
      }
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

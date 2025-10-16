import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { savePage, deletePage, getEditToken } from '@/lib/mediawiki'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, pageId } = await params
    const { title, content, slug, isPublished } = await request.json()

    const site = await prisma.site.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        siteId: id
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Update in MediaWiki
    const token = await getEditToken(site.wikiUrl)
    await savePage(title || page.title, content || page.content, token, site.wikiUrl)

    // Update in local database
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        title: title || page.title,
        content: content || page.content,
        slug: slug || page.slug,
        isPublished: isPublished !== undefined ? isPublished : page.isPublished
      }
    })

    return NextResponse.json(updatedPage)
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, pageId } = await params
    const site = await prisma.site.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        siteId: id
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Delete from MediaWiki
    const token = await getEditToken(site.wikiUrl)
    await deletePage(page.title, token, site.wikiUrl)

    // Delete from local database
    await prisma.page.delete({
      where: { id: pageId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string; revisionId: string }> }
) {
  try {
    const { id: siteId, pageId, revisionId } = await params

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

    // Get the specific revision
    const revision = await prisma.pageRevision.findUnique({
      where: { id: revisionId },
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

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
    }

    return NextResponse.json(revision)
  } catch (error) {
    console.error('Error fetching revision:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string; revisionId: string }> }
) {
  try {
    const { id: siteId, pageId, revisionId } = await params
    const { comment } = await request.json()

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

    // Get the revision to restore
    const revision = await prisma.pageRevision.findUnique({
      where: { id: revisionId }
    })

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
    }

    // Create a new revision with the restored content
    const newRevision = await prisma.pageRevision.create({
      data: {
        content: revision.content,
        comment: comment || `Restored to revision from ${revision.createdAt.toISOString()}`,
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

    // Update the page content
    await prisma.page.update({
      where: { id: pageId },
      data: { content: revision.content }
    })

    return NextResponse.json(newRevision)
  } catch (error) {
    console.error('Error restoring revision:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

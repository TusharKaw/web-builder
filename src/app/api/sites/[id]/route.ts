import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { manageWikiSite } from '@/lib/mediawiki'

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
      },
      include: {
        pages: true
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    return NextResponse.json(site)
  } catch (error) {
    console.error('Error fetching site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name, domain } = await request.json()

    const site = await prisma.site.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const updatedSite = await prisma.site.update({
      where: { id },
      data: {
        name,
        domain
      }
    })

    return NextResponse.json(updatedSite)
  } catch (error) {
    console.error('Error updating site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Delete the wiki from MediaWiki farm
    const wikiDeleted = await manageWikiSite(site.wikiUrl, 'delete')
    
    if (!wikiDeleted) {
      console.warn('Failed to delete wiki from MediaWiki farm, but continuing with local deletion')
    }

    // Mark site as inactive in local database
    await prisma.site.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params

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
      where: { id: pageId },
      select: {
        id: true,
        title: true,
        isProtected: true
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({
      isProtected: page.isProtected,
      pageTitle: page.title
    })
  } catch (error) {
    console.error('Error fetching page protection status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params
    const { isProtected } = await request.json()

    console.log(`[PROTECTION] Updating protection for pageId: ${pageId}, isProtected: ${isProtected}`)

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

        // Simple page protection update
        console.log(`[PROTECTION] Updating protection for pageId: ${pageId}, isProtected: ${isProtected}`)
        
        const updatedPage = await prisma.page.update({
          where: { id: pageId },
          data: { isProtected: Boolean(isProtected) },
          select: {
            id: true,
            title: true,
            isProtected: true
          }
        })

        console.log(`[PROTECTION] Page protection updated: ${updatedPage.title} is now ${updatedPage.isProtected ? 'protected' : 'unprotected'}`)

        return NextResponse.json({
          isProtected: updatedPage.isProtected,
          pageTitle: updatedPage.title,
          message: updatedPage.isProtected 
            ? 'Page is now protected from editing' 
            : 'Page is now unprotected and can be edited'
        })
  } catch (error) {
    console.error('Error updating page protection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

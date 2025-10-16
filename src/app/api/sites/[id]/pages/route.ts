import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPage, updatePage } from '@/lib/mediawiki'

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
        userId: session.user.id,
      },
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found or unauthorized' }, { status: 404 })
    }

    const pages = await prisma.page.findMany({
      where: {
        siteId: site.id,
        isPublished: true
      },
      orderBy: {
        createdAt: 'desc'
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
    const { title, content, isPublished = true } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const site = await prisma.site.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found or unauthorized' }, { status: 404 })
    }

    // Check if page already exists
    const existingPage = await prisma.page.findFirst({
      where: {
        siteId: site.id,
        title
      }
    })

    let page
    if (existingPage) {
      // Update existing page
      await updatePage(title, content, site.wikiUrl)
      page = await prisma.page.update({
        where: { id: existingPage.id },
        data: {
          content,
          isPublished,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new page
      await createPage(title, content, site.wikiUrl)
      page = await prisma.page.create({
        data: {
          title,
          content,
          isPublished,
          siteId: site.id
        }
      })
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error creating/updating page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
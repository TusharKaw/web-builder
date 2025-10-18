import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFile, getFileInfo } from '@/lib/mediawiki-comprehensive'

export async function POST(
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const comment = formData.get('comment') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type (only images for now)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const fileBuffer = Buffer.from(bytes)

    // Upload to MediaWiki
    const uploadSuccess = await uploadFile(file.name, fileBuffer, comment, site.wikiUrl)

    if (!uploadSuccess) {
      return NextResponse.json({ error: 'Failed to upload file to MediaWiki' }, { status: 500 })
    }

    // Get file info from MediaWiki
    const fileInfo = await getFileInfo(file.name, site.wikiUrl)

    if (!fileInfo) {
      return NextResponse.json({ error: 'Failed to get file info from MediaWiki' }, { status: 500 })
    }

    // Save file record to local database
    const fileRecord = await prisma.pageFile.create({
      data: {
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: fileInfo.url,
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

    return NextResponse.json({
      ...fileRecord,
      mediawikiInfo: fileInfo
    })
  } catch (error) {
    console.error('Error uploading file to MediaWiki:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      where: { id: pageId }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Get files from MediaWiki
    const mediawikiFiles = await getPageFiles(page.title, site.wikiUrl)

    // Get local files
    const localFiles = await prisma.pageFile.findMany({
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
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      mediawikiFiles,
      localFiles
    })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

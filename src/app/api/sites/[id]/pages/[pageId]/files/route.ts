import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

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

    // Get all files for this page
    const files = await prisma.pageFile.findMany({
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

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params
    console.log(`[FILE UPLOAD] Starting upload for siteId: ${siteId}, pageId: ${pageId}`)

    const session = await getServerSession(authOptions)

    if (!session) {
      console.log('[FILE UPLOAD] No session found')
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

    console.log(`[FILE UPLOAD] File received: ${file?.name}, size: ${file?.size}`)

    if (!file) {
      console.log('[FILE UPLOAD] No file provided')
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

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${randomUUID()}.${fileExtension}`
    
    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', siteId, pageId)
    console.log(`[FILE UPLOAD] Creating directory: ${uploadDir}`)
    try {
      await mkdir(uploadDir, { recursive: true })
      console.log(`[FILE UPLOAD] Directory created successfully`)
    } catch (error) {
      console.error('[FILE UPLOAD] Error creating upload directory:', error)
      return NextResponse.json({ error: 'Failed to create upload directory' }, { status: 500 })
    }

    // Save file
    const filePath = join(uploadDir, uniqueFilename)
    console.log(`[FILE UPLOAD] Saving file to: ${filePath}`)
    const bytes = await file.arrayBuffer()
    try {
      await writeFile(filePath, Buffer.from(bytes))
      console.log(`[FILE UPLOAD] File saved successfully`)
    } catch (error) {
      console.error('[FILE UPLOAD] Error saving file:', error)
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
    }

    // Save file record to database
    try {
      const fileRecord = await prisma.pageFile.create({
        data: {
          filename: uniqueFilename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          path: `/uploads/${siteId}/${pageId}/${uniqueFilename}`,
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
      
      return NextResponse.json(fileRecord)
    } catch (error) {
      console.error('Error saving file record to database:', error)
      return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

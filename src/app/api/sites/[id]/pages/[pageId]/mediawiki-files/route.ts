import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFileToMediaWiki, getFilesFromMediaWiki } from '@/lib/mediawiki-real'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

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

        // Get files from MediaWiki, fallback to local
        try {
          console.log(`[MEDIAWIKI FILES] Getting files for page: ${page.title}`)
          const mediawikiFiles = await getFilesFromMediaWiki(page.title)
          console.log(`[MEDIAWIKI FILES] Found ${mediawikiFiles.length} files from MediaWiki`)

          // If no MediaWiki files, get local files
          if (mediawikiFiles.length === 0) {
            console.log(`[MEDIAWIKI FILES] No MediaWiki files, getting local files`)
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
            console.log(`[MEDIAWIKI FILES] Found ${localFiles.length} local files`)
            return NextResponse.json(localFiles)
          }

          return NextResponse.json(mediawikiFiles)
        } catch (error) {
          console.error('Error fetching MediaWiki files:', error)
          // Fallback to local files on error
          try {
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
            console.log(`[MEDIAWIKI FILES] Error occurred, returning ${localFiles.length} local files`)
            return NextResponse.json(localFiles)
          } catch (fallbackError) {
            console.error('Error fetching local files:', fallbackError)
            return NextResponse.json([])
          }
        }
  } catch (error) {
    console.error('Error in MediaWiki files API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    console.log(`[MEDIAWIKI UPLOAD] Uploading file: ${file?.name} to MediaWiki`)

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

        // Upload file to MediaWiki, fallback to local
        try {
          console.log(`[MEDIAWIKI UPLOAD] Uploading file: ${file.name} to MediaWiki`)

          const uploadSuccess = await uploadFileToMediaWiki(file.name, fileBuffer, comment)

          if (uploadSuccess) {
            console.log(`[MEDIAWIKI UPLOAD] File uploaded successfully: ${file.name}`)
            return NextResponse.json({
              success: true,
              filename: file.name,
              message: 'File uploaded to MediaWiki successfully'
            })
          } else {
            console.log(`[MEDIAWIKI UPLOAD] MediaWiki upload failed, using local storage`)

            // Fallback to local file storage
            const fileExtension = file.name.split('.').pop()
            const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

            // Create upload directory
            const uploadDir = join(process.cwd(), 'public', 'uploads', siteId, pageId)
            await mkdir(uploadDir, { recursive: true })

            // Save file
            const filePath = join(uploadDir, uniqueFilename)
            await writeFile(filePath, fileBuffer)

            // Save file record to database
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

            console.log(`[LOCAL UPLOAD] File uploaded successfully: ${file.name}`)
            return NextResponse.json(fileRecord)
          }

        } catch (uploadError) {
          console.error(`[UPLOAD] Upload error for ${file.name}:`, uploadError)
          return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 })
        }
  } catch (error) {
    console.error('Error uploading file to MediaWiki:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { editPageInMediaWiki } from '@/lib/mediawiki-real'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const { title, content, isPublished = true, comment, isMinor = false } = await request.json()
    
    // Get session for revision tracking
    const session = await getServerSession(authOptions)

    console.log(`[DEBUG] Saving page for subdomain: ${subdomain}`)
    console.log(`[DEBUG] Title: ${title}, Content length: ${content?.length}`)

    if (!title || !content) {
      console.log(`[DEBUG] Missing required fields - title: ${!!title}, content: ${!!content}`)
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Find the site by subdomain
    const site = await prisma.site.findFirst({
      where: {
        subdomain,
        isActive: true
      }
    })

    console.log(`[DEBUG] Site found: ${!!site}, Site ID: ${site?.id}`)

    if (!site) {
      console.log(`[DEBUG] Site not found for subdomain: ${subdomain}`)
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Check if page already exists
    console.log(`[DEBUG] Checking for existing page with title: ${title}`)
    const existingPage = await prisma.page.findFirst({
      where: {
        siteId: site.id,
        title
      }
    })

    // Check page protection if page exists
    if (existingPage && existingPage.isProtected) {
      console.log(`[DEBUG] Page is protected, checking permissions`)
      
      // Check if user is logged in
      if (!session) {
        console.log(`[DEBUG] No session for protected page`)
        return NextResponse.json({ error: 'This page is protected. You must be logged in to edit it.' }, { status: 401 })
      }
      
      // Check if user is the site owner
      if (session.user?.id !== site.userId) {
        console.log(`[DEBUG] User ${session.user?.id} is not the owner ${site.userId} of protected page`)
        return NextResponse.json({ error: 'This page is protected and can only be edited by the site owner.' }, { status: 403 })
      }
      
      console.log(`[DEBUG] Owner editing protected page - allowed`)
    }

    console.log(`[DEBUG] Existing page found: ${!!existingPage}`)

    let page
    if (existingPage) {
      console.log(`[DEBUG] Updating existing page: ${existingPage.id}`)
      // Update existing page
      try {
        console.log(`[DEBUG] Attempting to update page in MediaWiki`)
        const wikiUpdated = await editPageInMediaWiki(title, content, comment || 'Page updated', isMinor || false)
        console.log(`[DEBUG] MediaWiki update result: ${wikiUpdated}`)
        if (!wikiUpdated) {
          console.warn('Failed to update page in MediaWiki, but continuing with local update')
        }
      } catch (wikiError) {
        console.warn('MediaWiki update failed:', wikiError)
      }
      
      console.log(`[DEBUG] Updating page in local database`)
      page = await prisma.page.update({
        where: { id: existingPage.id },
        data: {
          title,
          slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          content,
          isPublished,
          updatedAt: new Date()
        }
      })
      console.log(`[DEBUG] Page updated successfully: ${page.id}`)
    } else {
      console.log(`[DEBUG] Creating new page`)
      // Create new page
      try {
        console.log(`[DEBUG] Attempting to create page in MediaWiki`)
        const wikiCreated = await editPageInMediaWiki(title, content, comment || 'Page created', isMinor || false)
        console.log(`[DEBUG] MediaWiki creation result: ${wikiCreated}`)
        if (!wikiCreated) {
          console.warn('Failed to create page in MediaWiki, but continuing with local creation')
        }
      } catch (wikiError) {
        console.warn('MediaWiki creation failed:', wikiError)
      }
      
      console.log(`[DEBUG] Creating page in local database`)
      page = await prisma.page.create({
        data: {
          title,
          slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          content,
          isPublished,
          siteId: site.id
        }
      })
      console.log(`[DEBUG] Page created successfully: ${page.id}`)
    }

    // Create revision (always create a revision for tracking)
    try {
      // If user is logged in, use their ID, otherwise use the site owner's ID
      const revisionUserId = session?.user?.id || site.userId
      console.log(`[DEBUG] Creating revision with userId: ${revisionUserId}, session: ${!!session}`)
      
      if (!revisionUserId) {
        console.error('[DEBUG] No user ID available for revision creation')
        throw new Error('No user ID available for revision creation')
      }
      
      const revision = await prisma.pageRevision.create({
        data: {
          content,
          comment: comment || (existingPage ? 'Page updated' : 'Page created'),
          isMinor: isMinor || false,
          pageId: page.id,
          userId: revisionUserId
        }
      })
      console.log(`[DEBUG] Revision created successfully: ${revision.id}`)
    } catch (revisionError) {
      console.error('Failed to create revision:', revisionError)
      console.error('Revision error details:', revisionError)
    }

    console.log(`[DEBUG] Page saved successfully: ${page.id}`)
    return NextResponse.json(page)
  } catch (error) {
    console.error('[DEBUG] Error creating/updating page:', error)
    console.error('[DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

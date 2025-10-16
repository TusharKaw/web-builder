import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { manageWikiSite } from '@/lib/mediawiki'

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
    const { action } = await request.json()

    if (!['suspend', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be suspend or activate' }, { status: 400 })
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

    // Manage the wiki in MediaWiki farm
    const success = await manageWikiSite(site.wikiUrl, action)
    
    if (!success) {
      return NextResponse.json({ error: `Failed to ${action} wiki` }, { status: 500 })
    }

    // Update local database
    await prisma.site.update({
      where: { id },
      data: { 
        isActive: action === 'activate'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Wiki ${action}d successfully` 
    })
  } catch (error) {
    console.error(`Error managing site:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

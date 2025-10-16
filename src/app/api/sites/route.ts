import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createWikiSite } from '@/lib/mediawiki'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sites = await prisma.site.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        pages: true
      }
    })

    return NextResponse.json(sites)
  } catch (error) {
    console.error('Error fetching sites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, subdomain } = await request.json()

    if (!name || !subdomain) {
      return NextResponse.json({ error: 'Name and subdomain are required' }, { status: 400 })
    }

    // Check if subdomain is already taken
    const existingSite = await prisma.site.findUnique({
      where: { subdomain }
    })

    if (existingSite) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 400 })
    }

    // Create wiki site
    const wikiUrl = await createWikiSite(subdomain)

    // Create site in database
    const site = await prisma.site.create({
      data: {
        name,
        subdomain,
        wikiUrl,
        userId: session.user.id
      }
    })

    return NextResponse.json(site)
  } catch (error) {
    console.error('Error creating site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

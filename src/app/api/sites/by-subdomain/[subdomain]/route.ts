import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params

    const site = await prisma.site.findFirst({
      where: {
        subdomain,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        wikiUrl: true,
        isActive: true
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    return NextResponse.json(site)
  } catch (error) {
    console.error('Error fetching site by subdomain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

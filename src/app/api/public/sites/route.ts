import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log(`[PUBLIC SITES API] Getting public sites, query: ${query}`)

    const sites = await prisma.site.findMany({
      where: {
        isActive: true,
        ...(query && {
          OR: [
            {
              subdomain: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
          ]
        })
      },
      select: {
        id: true,
        subdomain: true,
        name: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`[PUBLIC SITES API] Found ${sites.length} sites`)

    return NextResponse.json(sites)
  } catch (error) {
    console.error('Error fetching public sites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

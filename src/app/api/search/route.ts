import { NextRequest, NextResponse } from 'next/server'
import { searchUserWebsites, getSearchSuggestions, getAllWebsites } from '@/lib/mediawiki-real'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'search'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    console.log(`[SEARCH API] ${type} query: ${query}`)

    if (type === 'suggestions') {
      // Get search suggestions from MediaWiki (like Wikipedia)
      try {
        const suggestions = await getSearchSuggestions(query, limit)
        return NextResponse.json({
          suggestions,
          query,
          type: 'suggestions'
        })
      } catch (error) {
        console.error('Error getting suggestions:', error)
        return NextResponse.json({
          suggestions: [],
          query,
          type: 'suggestions'
        })
      }
    } else {
      // Get search results for user-created websites
      try {
        console.log(`[SEARCH API] Searching user websites for query: ${query}`)
        
        // Get websites from both MediaWiki and local database
        const [mediawikiWebsites, localSites] = await Promise.all([
          searchUserWebsites(query, Math.ceil(limit / 2)),
          prisma.site.findMany({
            where: {
              OR: [
                {
                  subdomain: {
                    contains: query
                  }
                },
                {
                  name: {
                    contains: query
                  }
                }
              ],
              isActive: true
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
            take: Math.ceil(limit / 2)
          })
        ])
        
        console.log(`[SEARCH API] MediaWiki results: ${mediawikiWebsites.length}`)
        console.log(`[SEARCH API] Local sites results: ${localSites.length}`)

        // Format local sites as website results
        const localWebsiteResults = localSites.map(site => ({
          name: site.name || site.subdomain,
          description: `Website created by ${site.user?.name || site.user?.email}`,
          subdomain: site.subdomain,
          logo: null,
          owner: site.user?.name || site.user?.email || 'Unknown',
          created_at: site.createdAt.toISOString(),
          url: `/${site.subdomain}`,
          type: 'website'
        }))

        // Combine results
        const allResults = [...mediawikiWebsites, ...localWebsiteResults].slice(0, limit)
        console.log(`[SEARCH API] Found ${allResults.length} total website results`)

        return NextResponse.json({
          results: allResults,
          query,
          type: 'search',
          total: allResults.length
        })
      } catch (error) {
        console.error('Error getting search results:', error)
        return NextResponse.json({
          results: [],
          query,
          type: 'search',
          total: 0
        })
      }
    }
  } catch (error) {
    console.error('Error in search API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

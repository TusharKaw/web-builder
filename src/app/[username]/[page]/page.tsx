import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { fetchPage } from '@/lib/mediawiki'
import { getBaseDomain } from '@/lib/config'

interface PageProps {
  params: Promise<{
    username: string
    page: string
  }>
}

export default async function UserPage({ params }: PageProps) {
  const { username, page } = await params

  // Find the site by subdomain (username)
  const site = await prisma.site.findFirst({
    where: {
      subdomain: username,
      isActive: true
    }
  })

  if (!site) {
    notFound()
  }

  try {
    // First try to get content from local database
    let content = ''
    
    // Look for the page in local database first
    const pageRecord = await prisma.page.findFirst({
      where: {
        siteId: site.id,
        title: page,
        isPublished: true
      }
    })
    
    if (pageRecord) {
      content = pageRecord.content || ''
    } else {
      // Fallback to MediaWiki
      try {
        content = await fetchPage(page, site.wikiUrl)
      } catch {
        notFound()
      }
    }
    
    if (!content) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-white">
        {/* Main Content - Full Width */}
        <main className="w-full">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error fetching page content:', error)
    notFound()
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { username, page } = await params

  const site = await prisma.site.findFirst({
    where: {
      subdomain: username,
      isActive: true
    }
  })

  if (!site) {
    return {
      title: 'Page Not Found'
    }
  }

  return {
    title: `${page} - ${site.name}`,
    description: `Page ${page} from ${site.name}`,
  }
}

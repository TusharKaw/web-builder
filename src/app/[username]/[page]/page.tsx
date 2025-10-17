import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

  // Get the current session
  const session = await getServerSession(authOptions)

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

  // Check if the current user is the owner of this site
  const isOwner = session?.user?.id === site.userId

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
        // Page doesn't exist in MediaWiki either
        content = ''
      }
    }
    
    // If no content exists, show "start creating" page
    if (!content) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">This page is empty</h1>
              <p className="text-xl text-gray-600 mb-8">
                The page "<strong>{page}</strong>" doesn't exist yet. 
                {isOwner 
                  ? " Click the button below to start creating it."
                  : " Please check back later."
                }
              </p>
            </div>
            
            {isOwner && (
              <div className="space-y-4">
                <a
                  href={`/${username}/edit?page=${encodeURIComponent(page)}`}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Create This Page
                </a>
                
                <div className="text-sm text-gray-500">
                  <p>Add HTML, CSS, and JavaScript to create your "{page}" page</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-white">
        {/* Edit Button - Only for Owner */}
        {isOwner && (
          <div className="fixed top-4 right-4 z-50">
            <a
              href={`/${username}/edit?page=${encodeURIComponent(page)}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Edit this page"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Page
            </a>
          </div>
        )}
        
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

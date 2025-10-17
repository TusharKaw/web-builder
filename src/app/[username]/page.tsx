import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchPage } from '@/lib/mediawiki'
import { getBaseDomain } from '@/lib/config'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

export default async function UserHomePage({ params }: PageProps) {
  const { username } = await params

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
    // First, try to get content from local database
    let content = ''
    let pageTitle = 'Home'
    
    // Look for a "Home" page in local database first
    let homePage = await prisma.page.findFirst({
      where: {
        siteId: site.id,
        title: 'Home',
        isPublished: true
      }
    })
    
    if (homePage) {
      content = homePage.content || ''
      pageTitle = homePage.title
    } else {
      // If no Home page, get the first available page from local database
      const pages = await prisma.page.findMany({
        where: {
          siteId: site.id,
          isPublished: true
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 1
      })
      
      if (pages.length > 0) {
        content = pages[0].content || ''
        pageTitle = pages[0].title
      }
    }
    
    // If no content in local database, try MediaWiki as fallback
    if (!content) {
      try {
        content = await fetchPage('Home', site.wikiUrl)
      } catch {
        // If Home page doesn't exist in MediaWiki, try to get the first page
        const pages = await prisma.page.findMany({
          where: {
            siteId: site.id,
            isPublished: true
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
        })
        
        if (pages.length > 0) {
          content = await fetchPage(pages[0].title, site.wikiUrl)
          pageTitle = pages[0].title
        }
      }
    }

        if (!content) {
          // Show a simple "Get Started" page without branding
          return (
            <div className="min-h-screen bg-white flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-4">
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to {site.name}</h1>
                  <p className="text-xl text-gray-600 mb-8">
                    {isOwner 
                      ? "This website is ready to be customized. Click the button below to start building your content."
                      : "This website is under construction. Please check back later."
                    }
                  </p>
                </div>
                
                {isOwner && (
                  <div className="space-y-4">
                    <a
                      href={`/${username}/edit`}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Start Building
                    </a>
                    
                    <div className="text-sm text-gray-500">
                      <p>Add HTML, CSS, and JavaScript to create your unique website</p>
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
                  href={`/${username}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  title="Edit your website"
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
  const { username } = await params

  const site = await prisma.site.findFirst({
    where: {
      subdomain: username,
      isActive: true
    }
  })

  if (!site) {
    return {
      title: 'Site Not Found'
    }
  }

  return {
    title: site.name,
    description: `Welcome to ${site.name}`,
  }
}

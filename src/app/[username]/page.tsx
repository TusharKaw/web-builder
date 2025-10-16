import { notFound } from 'next/navigation'
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
      // Show a MediaWiki-like "Get Started" page
      return (
        <div className="min-h-screen bg-white">
          {/* Header */}
          <header className="border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
                  <p className="text-gray-600 mt-1">
                    {site.domain || `${site.subdomain}.${getBaseDomain()}`}
                  </p>
                </div>
                <nav className="flex space-x-6">
                  <a
                    href={`/${username}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Home
                  </a>
                  <a
                    href={`/${username}/edit`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                  >
                    Edit Page
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content - Get Started */}
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Get Started</h1>
                <p className="text-xl text-gray-600 mb-8">
                  This page doesn't exist yet. Click the button below to create it and start building your website.
                </p>
              </div>
              
              <div className="space-y-4">
                <a
                  href={`/${username}/edit`}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit This Page
                </a>
                
                <div className="text-sm text-gray-500">
                  <p>You can add HTML, CSS, and JavaScript to build your website</p>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-200 mt-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-gray-600">
                <p>© 2024 {site.name}. Built with Website Builder.</p>
              </div>
            </div>
          </footer>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
                <p className="text-gray-600 mt-1">
                  {site.domain || `${site.subdomain}.${getBaseDomain()}`}
                </p>
              </div>
              <nav className="flex space-x-6">
                <a
                  href={`/${username}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Home
                </a>
                <a
                  href={`/${username}/about`}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  About
                </a>
                <a
                  href={`/${username}/contact`}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Contact
                </a>
                <a
                  href={`/${username}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                  Edit Page
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <article className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </article>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600">
              <p>© 2024 {site.name}. Built with Website Builder.</p>
            </div>
          </div>
        </footer>
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

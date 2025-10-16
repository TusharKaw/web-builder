import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { fetchPage } from '@/lib/mediawiki'

interface PageProps {
  params: {
    username: string
  }
}

export default async function UserHomePage({ params }: PageProps) {
  const { username } = params

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
    // Try to fetch a "Home" page, fallback to first available page
    let content = ''
    let pageTitle = 'Home'
    
    try {
      content = await fetchPage('Home', site.wikiUrl)
    } catch {
      // If Home page doesn't exist, try to get the first page
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

    if (!content) {
      // Show a default welcome page
      content = `
        <div class="text-center py-12">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to ${site.name}</h1>
          <p class="text-xl text-gray-600 mb-8">This site is under construction.</p>
          <p class="text-gray-500">Content will be available soon.</p>
        </div>
      `
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
                  {site.domain || `${site.subdomain}.xfanstube.com`}
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
  const { username } = params

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

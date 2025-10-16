import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { fetchPage } from '@/lib/mediawiki'
import { getBaseDomain } from '@/lib/config'

interface PageProps {
  params: {
    username: string
    page: string
  }
}

export default async function UserPage({ params }: PageProps) {
  const { username, page } = params

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
    // Fetch page content from MediaWiki
    const content = await fetchPage(page, site.wikiUrl)
    
    if (!content) {
      notFound()
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
                  className="text-gray-600 hover:text-gray-900 font-medium"
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
  const { username, page } = params

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

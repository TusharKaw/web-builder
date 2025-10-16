import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Globe, FileText, TrendingUp } from 'lucide-react'
import { getBaseDomain } from '@/lib/config'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
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

  const totalPages = sites.reduce((acc: number, site: any) => acc + site.pages.length, 0)
  const publishedPages = sites.reduce((acc: number, site: any) => 
    acc + site.pages.filter((page: any) => page.isPublished).length, 0
  )

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {session.user.name || session.user.email}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sites</p>
              <p className="text-2xl font-bold text-gray-900">{sites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pages</p>
              <p className="text-2xl font-bold text-gray-900">{totalPages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published Pages</p>
              <p className="text-2xl font-bold text-gray-900">{publishedPages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/dashboard/sites/new"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Create New Site</h3>
              <p className="text-sm text-gray-600">Start building your website</p>
            </div>
          </Link>

          <Link
            href="/dashboard/sites"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Manage Sites</h3>
              <p className="text-sm text-gray-600">View and edit your websites</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Sites */}
      {sites.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Sites</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.slice(0, 6).map((site: any) => (
              <div key={site.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{site.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    <span>{site.subdomain}.{getBaseDomain()}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>{site.pages.length} pages</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/sites/${site.id}`}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/${site.subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {sites.length > 6 && (
            <div className="mt-6 text-center">
              <Link
                href="/dashboard/sites"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View all sites →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {sites.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sites yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first website
          </p>
          <Link
            href="/dashboard/sites/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Site
          </Link>
        </div>
      )}
    </div>
  )
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Globe, FileText, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  // Get admin statistics
  const [
    totalUsers,
    totalSites,
    totalPages,
    activeSites,
    inactiveSites
  ] = await Promise.all([
    prisma.user.count(),
    prisma.site.count(),
    prisma.page.count(),
    prisma.site.count({ where: { isActive: true } }),
    prisma.site.count({ where: { isActive: false } })
  ])

  // Get recent users
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: { sites: true }
      }
    }
  })

  // Get recent sites
  const recentSites = await prisma.site.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true }
      },
      _count: {
        select: { pages: true }
      }
    }
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Platform overview and management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sites</p>
              <p className="text-2xl font-bold text-gray-900">{totalSites}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pages</p>
              <p className="text-2xl font-bold text-gray-900">{totalPages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Sites</p>
              <p className="text-2xl font-bold text-gray-900">{activeSites}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {inactiveSites > 0 && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              {inactiveSites} inactive site{inactiveSites > 1 ? 's' : ''} need{inactiveSites === 1 ? 's' : ''} attention.
            </p>
            <Link
              href="/admin/sites?filter=inactive"
              className="ml-2 text-yellow-600 hover:text-yellow-800 font-medium"
            >
              View →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
              <Link
                href="/admin/users"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.name || 'Unnamed User'}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user._count.sites} site{user._count.sites !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sites */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Sites</h2>
              <Link
                href="/admin/sites"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentSites.map((site: any) => (
                <div key={site.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{site.name}</p>
                    <p className="text-sm text-gray-600">
                      by {site.user.name || site.user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(site.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {site._count.pages} page{site._count.pages !== 1 ? 's' : ''}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      site.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {site.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

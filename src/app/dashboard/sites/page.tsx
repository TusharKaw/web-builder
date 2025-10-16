'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import SiteCard from '@/components/sites/SiteCard'
import { Plus, Loader2 } from 'lucide-react'

interface Site {
  id: string
  name: string
  subdomain: string
  domain?: string
  wikiUrl: string
  isActive: boolean
  createdAt: string
  pages: Array<{
    id: string
    title: string
    slug: string
    isPublished: boolean
  }>
}

export default function SitesPage() {
  const { data: session } = useSession()
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      if (!response.ok) {
        throw new Error('Failed to fetch sites')
      }
      const data = await response.json()
      setSites(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSite = async (siteId: string) => {
    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete site')
      }
      
      setSites(sites.filter(site => site.id !== siteId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete site')
    }
  }

  const handleManageSite = async (siteId: string, action: 'suspend' | 'activate') => {
    try {
      const response = await fetch(`/api/sites/${siteId}/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} site`)
      }
      
      // Update the site status in the local state
      setSites(sites.map(site => 
        site.id === siteId 
          ? { ...site, isActive: action === 'activate' }
          : site
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} site`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sites</h1>
          <p className="text-gray-600 mt-2">
            Manage all your websites
          </p>
        </div>
        
        <Link
          href="/dashboard/sites/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Site
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {sites.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onDelete={handleDeleteSite}
              onManage={handleManageSite}
            />
          ))}
        </div>
      )}
    </div>
  )
}

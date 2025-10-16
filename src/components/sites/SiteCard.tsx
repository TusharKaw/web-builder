'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe, ExternalLink, Settings, Trash2, Eye } from 'lucide-react'

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

interface SiteCardProps {
  site: Site
  onDelete?: (siteId: string) => void
}

export default function SiteCard({ site, onDelete }: SiteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    
    if (confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      setIsDeleting(true)
      try {
        await onDelete(site.id)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const siteUrl = site.domain || `${site.subdomain}.xfanstube.com`
  const publishedPages = site.pages.filter(page => page.isPublished).length

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Globe className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="font-medium">URL:</span>
              <a
                href={`https://${siteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>{siteUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">Pages:</span>
              <span>{publishedPages} published</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">Created:</span>
              <span>{new Date(site.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Link
            href={`/dashboard/sites/${site.id}`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="View site"
          >
            <Eye className="w-4 h-4" />
          </Link>
          
          <Link
            href={`/dashboard/sites/${site.id}/settings`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Delete site"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/sites/${site.id}/pages`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Manage Pages →
          </Link>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              site.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {site.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

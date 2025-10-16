'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Edit, Trash2, Eye, EyeOff } from 'lucide-react'

interface Page {
  id: string
  title: string
  slug: string
  content?: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface PageCardProps {
  page: Page
  siteId: string
  onDelete?: (pageId: string) => void
  onTogglePublish?: (pageId: string, isPublished: boolean) => void
}

export default function PageCard({ page, siteId, onDelete, onTogglePublish }: PageCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    
    if (confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      setIsDeleting(true)
      try {
        await onDelete(page.id)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleTogglePublish = async () => {
    if (!onTogglePublish) return
    
    setIsToggling(true)
    try {
      await onTogglePublish(page.id, !page.isPublished)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Slug:</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                /{page.slug}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">Updated:</span>
              <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
            </div>
            
            {page.content && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Content:</span>
                <span>{page.content.length} characters</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleTogglePublish}
            disabled={isToggling}
            className={`p-2 rounded-md transition-colors ${
              page.isPublished
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            } disabled:opacity-50`}
            title={page.isPublished ? 'Unpublish page' : 'Publish page'}
          >
            {page.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          
          <Link
            href={`/dashboard/sites/${siteId}/pages/${page.id}/edit`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Edit page"
          >
            <Edit className="w-4 h-4" />
          </Link>
          
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Delete page"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/sites/${siteId}/pages/${page.id}/edit`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit Page →
          </Link>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              page.isPublished 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {page.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

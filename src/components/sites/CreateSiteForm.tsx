'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Loader2 } from 'lucide-react'

export default function CreateSiteForm() {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create site')
      }

      const site = await response.json()
      router.push(`/dashboard/sites/${site.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
    
    setFormData(prev => ({ ...prev, subdomain: value }))
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Create Your Website</h1>
        <p className="text-gray-600 mt-2">
          Get started by creating your first website
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Site Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="My Awesome Website"
            required
          />
        </div>

        <div>
          <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
            Subdomain
          </label>
          <div className="flex">
            <input
              type="text"
              id="subdomain"
              value={formData.subdomain}
              onChange={handleSubdomainChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="my-site"
              required
            />
            <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
              .xfanstube.com
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Only lowercase letters, numbers, and hyphens allowed
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !formData.name || !formData.subdomain}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Site...
            </>
          ) : (
            'Create Site'
          )}
        </button>
      </form>
    </div>
  )
}

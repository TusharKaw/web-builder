'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, ExternalLink, Clock, FileText, Globe, Users } from 'lucide-react'
import WebsiteSearchBar from '@/components/search/WebsiteSearchBar'

interface WebsiteResult {
  name: string
  description: string
  subdomain: string
  logo?: string | null
  owner: string
  created_at: string
  url: string
  type: string
}

export default function SearchPage() {
  const [results, setResults] = useState<WebsiteResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const searchQuery = searchParams.get('q')
    if (searchQuery) {
      setQuery(searchQuery)
      handleSearch(searchQuery)
    }
  }, [searchParams])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setHasSearched(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=search&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const handleWebsiteClick = (website: WebsiteResult) => {
    // Navigate to the website subdomain
    router.push(website.url)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wikipedia-style Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Search Websites</h1>
          <p className="text-lg text-gray-600 mb-8">Find websites created on our platform</p>
          
          {/* Large Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <WebsiteSearchBar className="text-lg" />
            </div>
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">
                {isLoading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
              </h2>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Searching websites...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {results.map((website, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleWebsiteClick(website)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {website.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900">{website.name}</h3>
                            <p className="text-sm text-blue-600">{website.subdomain}.localhost:3000</p>
                          </div>
                        </div>
                        <ExternalLink className="h-5 w-5 text-gray-400" />
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {website.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          <span>by {website.owner}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(website.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Search className="h-16 w-16 mx-auto mb-6 text-gray-400" />
                <h3 className="text-xl font-medium text-gray-900 mb-3">No results found</h3>
                <p className="text-gray-600 mb-6">Try searching with different keywords or check your spelling.</p>
                <div className="text-sm text-gray-500">
                  <p>Search tips:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Try different keywords</li>
                    <li>• Check your spelling</li>
                    <li>• Use more general terms</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Browse All Websites */}
        {!hasSearched && (
          <div className="text-center py-12">
            <Globe className="h-16 w-16 mx-auto mb-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Discover Websites</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Browse through all the amazing websites created by our community. 
              Use the search bar above to find specific websites or browse by category.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setQuery('*')
                  handleSearch('*')
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium text-lg"
              >
                Browse All Websites
              </button>
              <button
                onClick={() => {
                  setQuery('a')
                  handleSearch('a')
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-md font-medium text-lg"
              >
                Browse by Letter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

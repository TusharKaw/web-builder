'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, ExternalLink, Globe, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface WebsiteSearchBarProps {
  className?: string
}

export default function WebsiteSearchBar({ className = '' }: WebsiteSearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<WebsiteResult[]>([])
  const [results, setResults] = useState<WebsiteResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search for suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=suggestions&limit=5`)
        if (response.ok) {
          const data = await response.json()
          // Convert suggestions to website format
          const websiteSuggestions = data.suggestions?.map((suggestion: string) => ({
            name: suggestion,
            description: `Website: ${suggestion}`,
            subdomain: suggestion.toLowerCase().replace(/\s+/g, ''),
            logo: null,
            owner: 'Unknown',
            created_at: new Date().toISOString(),
            url: `/${suggestion.toLowerCase().replace(/\s+/g, '')}`,
            type: 'website'
          })) || []
          setSuggestions(websiteSuggestions)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setResults([]) // Clear previous results
    setShowResults(true)
    setIsOpen(false)
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=search&limit=10`)
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

  const handleSuggestionClick = (suggestion: WebsiteResult) => {
    setQuery(suggestion.name)
    setIsOpen(false)
    handleSearch(suggestion.name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setShowResults(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleWebsiteClick = (website: WebsiteResult) => {
    // Navigate to the website subdomain
    router.push(website.url)
    setShowResults(false)
    setQuery('')
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search websites..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setResults([])
              setShowResults(false)
              inputRef.current?.focus()
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-blue-500 mr-3" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{suggestion.name}</div>
                  <div className="text-sm text-gray-500">{suggestion.description}</div>
                  <div className="text-xs text-blue-600">{suggestion.subdomain}.localhost:3000</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Searching websites...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  {results.length} website{results.length !== 1 ? 's' : ''} found
                </span>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {results.map((website, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleWebsiteClick(website)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Globe className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {website.name}
                        </h3>
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                          Website
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {website.description}
                      </p>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        <span className="mr-2">by {website.owner}</span>
                        <span className="mr-2">•</span>
                        <span className="text-blue-600">{website.subdomain}.localhost:3000</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <Globe className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No websites found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

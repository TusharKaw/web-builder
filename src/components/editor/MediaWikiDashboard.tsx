'use client'

import { useState, useEffect } from 'react'
import { 
  History, 
  Upload, 
  Shield, 
  Search, 
  Users, 
  BarChart3, 
  FileText, 
  Tag,
  Eye,
  Clock,
  TrendingUp,
  Database
} from 'lucide-react'

interface MediaWikiDashboardProps {
  siteId: string
  pageId: string
  pageTitle: string
}

interface DashboardStats {
  totalPages: number
  totalFiles: number
  totalCategories: number
  totalTemplates: number
  recentChanges: any[]
  watchlist: string[]
  wikiStats: any
}

export default function MediaWikiDashboard({ siteId, pageId, pageTitle }: MediaWikiDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'recent' | 'files' | 'categories' | 'templates' | 'search'>('overview')

  useEffect(() => {
    loadDashboardData()
  }, [siteId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load wiki statistics
      const statsResponse = await fetch(`/api/sites/${siteId}/pages/${pageId}/comprehensive?action=stats`)
      const wikiStats = statsResponse.ok ? await statsResponse.json() : {}

      // Load recent changes
      const recentResponse = await fetch(`/api/sites/${siteId}/pages/${pageId}/comprehensive?action=recent-changes&limit=10`)
      const recentChanges = recentResponse.ok ? await recentResponse.json() : []

      // Load watchlist
      const watchlistResponse = await fetch(`/api/sites/${siteId}/pages/${pageId}/comprehensive?action=watchlist`)
      const watchlist = watchlistResponse.ok ? await watchlistResponse.json() : []

      setStats({
        totalPages: wikiStats.statistics?.articles || 0,
        totalFiles: wikiStats.statistics?.images || 0,
        totalCategories: 0, // Will be loaded separately
        totalTemplates: 0, // Will be loaded separately
        recentChanges: Array.isArray(recentChanges) ? recentChanges : [],
        watchlist: Array.isArray(watchlist) ? watchlist : [],
        wikiStats
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load MediaWiki dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/comprehensive?action=search&q=${encodeURIComponent(query)}&limit=20`)
      const results = await response.json()
      return results
    } catch (error) {
      console.error('Error searching:', error)
      return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading MediaWiki dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-red-600" />
            <h3 className="text-lg font-semibold text-red-600">MediaWiki Dashboard Error</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null)
                loadDashboardData()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-6 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No MediaWiki data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">MediaWiki Dashboard</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive MediaWiki backend integration
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Recent Changes
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'files'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Files
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tag className="w-4 h-4 inline mr-2" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Pages</p>
                    <p className="text-2xl font-bold text-blue-600">{stats?.totalPages || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Upload className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Files</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.totalFiles || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Tag className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-purple-600">{stats?.totalCategories || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Templates</p>
                    <p className="text-2xl font-bold text-orange-600">{stats?.totalTemplates || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Wiki Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Site Name:</strong> {stats?.wikiStats?.general?.sitename || 'N/A'}</p>
                  <p><strong>Language:</strong> {stats?.wikiStats?.general?.lang || 'N/A'}</p>
                  <p><strong>Version:</strong> {stats?.wikiStats?.general?.generator || 'N/A'}</p>
                  <p><strong>Base URL:</strong> {stats?.wikiStats?.general?.base || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Watchlist</h4>
                <div className="text-sm">
                  <p><strong>Watched Pages:</strong> {Array.isArray(stats?.watchlist) ? stats.watchlist.length : 0}</p>
                  {Array.isArray(stats?.watchlist) && stats.watchlist.slice(0, 3).map((page: string, index: number) => (
                    <p key={index} className="text-gray-600 truncate">{page}</p>
                  ))}
                  {Array.isArray(stats?.watchlist) && stats.watchlist.length > 3 && (
                    <p className="text-gray-500">... and {stats.watchlist.length - 3} more</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Recent Changes</h4>
            {Array.isArray(stats?.recentChanges) && stats.recentChanges.length > 0 ? (
              <div className="space-y-3">
                {stats.recentChanges.map((change: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{change.title}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {change.user}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(change.timestamp).toLocaleString()}
                        </span>
                        {change.minor && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            minor
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      #{change.revid}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent changes found</p>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Search MediaWiki</h4>
            <SearchInterface onSearch={handleSearch} />
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">MediaWiki Files</h4>
            <p className="text-gray-600">Files uploaded to MediaWiki backend</p>
            <MediaWikiFilesList siteId={siteId} pageId={pageId} pageTitle={pageTitle} />
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Categories</h4>
            <MediaWikiCategoriesList siteId={siteId} pageId={pageId} pageTitle={pageTitle} />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Templates</h4>
            <MediaWikiTemplatesList siteId={siteId} pageId={pageId} pageTitle={pageTitle} />
          </div>
        )}
      </div>
    </div>
  )
}

// Search Interface Component
function SearchInterface({ onSearch }: { onSearch: (query: string) => Promise<any[]> }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const searchResults = await onSearch(query)
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pages..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900">{result.title}</h5>
              {result.snippet && (
                <p className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: result.snippet }} />
              )}
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                <span>Size: {result.size} bytes</span>
                <span>Words: {result.wordcount}</span>
                <span>{new Date(result.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// MediaWiki Files List Component
function MediaWikiFilesList({ siteId, pageId, pageTitle }: { siteId: string; pageId: string; pageTitle: string }) {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFiles()
  }, [siteId, pageId])

  const loadFiles = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/mediawiki-upload`)
      const data = await response.json()
      setFiles(data.mediawikiFiles || [])
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading files...</div>
  }

  return (
    <div className="space-y-2">
      {files.length > 0 ? (
        files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Upload className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{file.title}</p>
                <p className="text-sm text-gray-600">{file.mime} • {file.size} bytes</p>
              </div>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View
            </a>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-4">No files found</p>
      )}
    </div>
  )
}

// MediaWiki Categories List Component
function MediaWikiCategoriesList({ siteId, pageId, pageTitle }: { siteId: string; pageId: string; pageTitle: string }) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [siteId, pageId])

  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/comprehensive?action=categories`)
      const data = await response.json()
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading categories...</div>
  }

  return (
    <div className="space-y-2">
      {categories.length > 0 ? (
        categories.map((category, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Tag className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">{category.title}</p>
              <p className="text-sm text-gray-600">Sort key: {category.sortkey}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-4">No categories found</p>
      )}
    </div>
  )
}

// MediaWiki Templates List Component
function MediaWikiTemplatesList({ siteId, pageId, pageTitle }: { siteId: string; pageId: string; pageTitle: string }) {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [siteId, pageId])

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/comprehensive?action=templates`)
      const data = await response.json()
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading templates...</div>
  }

  return (
    <div className="space-y-2">
      {templates.length > 0 ? (
        templates.map((template, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FileText className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">{template.title}</p>
              <p className="text-sm text-gray-600">Namespace: {template.ns}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-4">No templates found</p>
      )}
    </div>
  )
}

import { getWikiApiUrl } from './config'

const MEDIAWIKI_API_URL = process.env.MEDIAWIKI_API_URL || 'http://13.233.126.84/api.php'

// Enhanced interfaces for comprehensive MediaWiki integration
export interface MediaWikiRevision {
  revid: number
  parentid: number
  user: string
  userid: number
  timestamp: string
  comment: string
  size: number
  sha1: string
  contentmodel: string
  contentformat: string
  content: string
  minor: boolean
}

export interface MediaWikiFile {
  name: string
  title: string
  url: string
  descriptionurl: string
  mime: string
  size: number
  width?: number
  height?: number
  thumburl?: string
  thumbwidth?: number
  thumbheight?: number
}

export interface MediaWikiCategory {
  title: string
  sortkey: string
  timestamp: string
}

export interface MediaWikiTemplate {
  title: string
  ns: number
  exists: boolean
}

export interface MediaWikiUser {
  userid: number
  name: string
  editcount: number
  registration: string
  groups: string[]
  rights: string[]
}

export interface MediaWikiSearchResult {
  title: string
  snippet: string
  size: number
  timestamp: string
  wordcount: number
}

export interface MediaWikiRecentChange {
  type: string
  ns: number
  title: string
  comment: string
  timestamp: string
  user: string
  bot: boolean
  minor: boolean
  revid: number
  old_revid: number
  rc_id: number
}

/**
 * Get comprehensive page information including revisions, categories, templates
 */
export async function getPageInfo(title: string, wikiUrl?: string): Promise<any> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'info|revisions|categories|templates|images|links|extlinks|langlinks',
    rvprop: 'ids|timestamp|user|comment|content|size|sha1|contentmodel|contentformat',
    rvlimit: '50',
    inprop: 'url|displaytitle|protection|watchers',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get page info')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    return pages[pageId]
  } catch (error) {
    console.error('Error getting page info:', error)
    throw error
  }
}

/**
 * Get page revision history with full details
 */
export async function getPageHistory(title: string, limit: number = 50, wikiUrl?: string): Promise<MediaWikiRevision[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'revisions',
    rvprop: 'ids|timestamp|user|userid|comment|content|size|sha1|contentmodel|contentformat|flags',
    rvlimit: limit.toString(),
    rvdir: 'older',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get page history')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    
    return page.revisions || []
  } catch (error) {
    console.error('Error getting page history:', error)
    throw error
  }
}

/**
 * Get specific revision content
 */
export async function getRevisionContent(revid: number, wikiUrl?: string): Promise<string> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    revids: revid.toString(),
    prop: 'revisions',
    rvprop: 'content',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get revision content')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    
    return page.revisions?.[0]?.['*'] || ''
  } catch (error) {
    console.error('Error getting revision content:', error)
    throw error
  }
}

/**
 * Upload file to MediaWiki
 */
export async function uploadFile(
  filename: string,
  fileContent: Buffer,
  comment: string = '',
  wikiUrl?: string
): Promise<boolean> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  
  try {
    // Get upload token
    const tokenResponse = await fetch(`${apiUrl}?action=query&format=json&meta=tokens&type=csrf&origin=*`)
    const tokenData = await tokenResponse.json()
    const uploadToken = tokenData?.query?.tokens?.csrftoken

    if (!uploadToken) {
      throw new Error('Failed to get upload token')
    }

    const formData = new FormData()
    formData.append('action', 'upload')
    formData.append('format', 'json')
    formData.append('filename', filename)
    formData.append('file', new Blob([fileContent]))
    formData.append('comment', comment)
    formData.append('token', uploadToken)
    formData.append('origin', '*')

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to upload file')
    }

    return data.upload?.result === 'Success'
  } catch (error) {
    console.error('Error uploading file:', error)
    return false
  }
}

/**
 * Get files/images used in a page
 */
export async function getPageFiles(title: string, wikiUrl?: string): Promise<MediaWikiFile[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'images',
    imlimit: '500',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get page files')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    
    return page.images || []
  } catch (error) {
    console.error('Error getting page files:', error)
    throw error
  }
}

/**
 * Get file information
 */
export async function getFileInfo(filename: string, wikiUrl?: string): Promise<MediaWikiFile | null> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|size|mime|thumburl|thumbwidth|thumbheight|metadata',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get file info')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    
    return page.imageinfo?.[0] || null
  } catch (error) {
    console.error('Error getting file info:', error)
    return null
  }
}

/**
 * Get page categories
 */
export async function getPageCategories(title: string, wikiUrl?: string): Promise<MediaWikiCategory[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'categories',
    cllimit: '500',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get page categories')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    
    return page.categories || []
  } catch (error) {
    console.error('Error getting page categories:', error)
    throw error
  }
}

/**
 * Add categories to a page
 */
export async function addPageCategories(
  title: string,
  categories: string[],
  comment: string = 'Added categories',
  wikiUrl?: string
): Promise<boolean> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  
  try {
    // Get current page content
    const pageInfo = await getPageInfo(title, wikiUrl)
    const currentContent = pageInfo.revisions?.[0]?.['*'] || ''
    
    // Add categories to content
    const categoryText = categories.map(cat => `[[Category:${cat}]]`).join('\n')
    const newContent = currentContent + '\n' + categoryText
    
    // Get edit token
    const tokenResponse = await fetch(`${apiUrl}?action=query&format=json&meta=tokens&type=csrf&origin=*`)
    const tokenData = await tokenResponse.json()
    const editToken = tokenData?.query?.tokens?.csrftoken

    if (!editToken) {
      throw new Error('Failed to get edit token')
    }

    const formData = new URLSearchParams({
      action: 'edit',
      title,
      text: newContent,
      token: editToken,
      format: 'json',
      summary: comment,
      origin: '*'
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to add categories')
    }

    return data.edit?.result === 'Success'
  } catch (error) {
    console.error('Error adding categories:', error)
    return false
  }
}

/**
 * Get page templates
 */
export async function getPageTemplates(title: string, wikiUrl?: string): Promise<MediaWikiTemplate[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'templates',
    tllimit: '500',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get page templates')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    
    return page.templates || []
  } catch (error) {
    console.error('Error getting page templates:', error)
    throw error
  }
}

/**
 * Search pages
 */
export async function searchPages(
  query: string,
  limit: number = 20,
  wikiUrl?: string
): Promise<MediaWikiSearchResult[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'search',
    srsearch: query,
    srlimit: limit.toString(),
    srprop: 'snippet|size|timestamp|wordcount',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to search pages')
    }
    
    return data?.query?.search || []
  } catch (error) {
    console.error('Error searching pages:', error)
    throw error
  }
}

/**
 * Get recent changes
 */
export async function getRecentChanges(
  limit: number = 50,
  wikiUrl?: string
): Promise<MediaWikiRecentChange[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'recentchanges',
    rclimit: limit.toString(),
    rcprop: 'ids|title|timestamp|user|comment|flags|sizes',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get recent changes')
    }
    
    return data?.query?.recentchanges || []
  } catch (error) {
    console.error('Error getting recent changes:', error)
    throw error
  }
}

/**
 * Get user information
 */
export async function getUserInfo(username: string, wikiUrl?: string): Promise<MediaWikiUser | null> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'users',
    ususers: username,
    usprop: 'editcount|registration|groups|rights',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get user info')
    }
    
    return data?.query?.users?.[0] || null
  } catch (error) {
    console.error('Error getting user info:', error)
    return null
  }
}

/**
 * Add page to watchlist
 */
export async function addToWatchlist(title: string, wikiUrl?: string): Promise<boolean> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  
  try {
    // Get watch token
    const tokenResponse = await fetch(`${apiUrl}?action=query&format=json&meta=tokens&type=watch&origin=*`)
    const tokenData = await tokenResponse.json()
    const watchToken = tokenData?.query?.tokens?.watchtoken

    if (!watchToken) {
      throw new Error('Failed to get watch token')
    }

    const formData = new URLSearchParams({
      action: 'watch',
      titles: title,
      token: watchToken,
      format: 'json',
      origin: '*'
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to add to watchlist')
    }

    return data.watch?.watched === true
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return false
  }
}

/**
 * Get watchlist
 */
export async function getWatchlist(wikiUrl?: string): Promise<string[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'watchlist',
    wllimit: '500',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get watchlist')
    }
    
    return data?.query?.watchlist?.map((item: any) => item.title) || []
  } catch (error) {
    console.error('Error getting watchlist:', error)
    throw error
  }
}

/**
 * Set page protection
 */
export async function setPageProtection(
  title: string,
  protections: { [key: string]: string },
  expiry: string = 'indefinite',
  reason: string = 'Protected page',
  wikiUrl?: string
): Promise<boolean> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  
  try {
    // Get protect token
    const tokenResponse = await fetch(`${apiUrl}?action=query&format=json&meta=tokens&type=csrf&origin=*`)
    const tokenData = await tokenResponse.json()
    const protectToken = tokenData?.query?.tokens?.csrftoken

    if (!protectToken) {
      throw new Error('Failed to get protect token')
    }

    const formData = new URLSearchParams({
      action: 'protect',
      title,
      token: protectToken,
      format: 'json',
      reason,
      expiry,
      origin: '*'
    })

    // Add protection levels
    Object.entries(protections).forEach(([action, level]) => {
      formData.append(`protections[${action}]`, level)
      formData.append(`expiry[${action}]`, expiry)
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to set page protection')
    }

    return data.protect?.protections?.length > 0
  } catch (error) {
    console.error('Error setting page protection:', error)
    return false
  }
}

/**
 * Get page protection status
 */
export async function getPageProtection(title: string, wikiUrl?: string): Promise<any> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'info',
    inprop: 'protection',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get page protection')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    
    return page.protection || []
  } catch (error) {
    console.error('Error getting page protection:', error)
    throw error
  }
}

/**
 * Get all categories
 */
export async function getAllCategories(limit: number = 500, wikiUrl?: string): Promise<string[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'allcategories',
    aclimit: limit.toString(),
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get categories')
    }
    
    return data?.query?.allcategories?.map((cat: any) => cat['*']) || []
  } catch (error) {
    console.error('Error getting categories:', error)
    throw error
  }
}

/**
 * Get all templates
 */
export async function getAllTemplates(limit: number = 500, wikiUrl?: string): Promise<string[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'allpages',
    apnamespace: '10', // Template namespace
    aplimit: limit.toString(),
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get templates')
    }
    
    return data?.query?.allpages?.map((template: any) => template.title) || []
  } catch (error) {
    console.error('Error getting templates:', error)
    throw error
  }
}

/**
 * Get wiki statistics
 */
export async function getWikiStats(wikiUrl?: string): Promise<any> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    meta: 'siteinfo',
    siprop: 'statistics|general|namespaces',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get wiki stats')
    }
    
    return data?.query || {}
  } catch (error) {
    console.error('Error getting wiki stats:', error)
    throw error
  }
}

import { getWikiApiUrl } from './config'

const MEDIAWIKI_API_URL = process.env.MEDIAWIKI_API_URL || 'http://13.233.126.84/api.php'

export interface MediaWikiPage {
  title: string
  content: string
  html?: string
}

export interface MediaWikiEditResult {
  result: string
  pageid?: number
  title?: string
  oldrevid?: number
  newrevid?: number
}

export interface MediaWikiTokenResult {
  query: {
    tokens: {
      csrftoken: string
    }
  }
}

/**
 * Fetch a page from MediaWiki API
 */
export async function fetchPage(title: string, wikiUrl?: string): Promise<string> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'parse',
    page: title,
    format: 'json',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to fetch page')
    }
    
    return data?.parse?.text?.['*'] || ''
  } catch (error) {
    console.error('Error fetching page:', error)
    throw error
  }
}

/**
 * Get raw page content from MediaWiki API
 */
export async function fetchPageContent(title: string, wikiUrl?: string): Promise<string> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'revisions',
    rvprop: 'content',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to fetch page content')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    
    if (page.missing) {
      return ''
    }
    
    return page.revisions?.[0]?.['*'] || ''
  } catch (error) {
    console.error('Error fetching page content:', error)
    throw error
  }
}

/**
 * Get edit token from MediaWiki API
 */
export async function getEditToken(wikiUrl?: string): Promise<string> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    meta: 'tokens',
    type: 'csrf',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get edit token')
    }
    
    return data?.query?.tokens?.csrftoken || ''
  } catch (error) {
    console.error('Error getting edit token:', error)
    throw error
  }
}

/**
 * Save/Edit a page in MediaWiki
 */
export async function savePage(
  title: string, 
  content: string, 
  token?: string, 
  wikiUrl?: string
): Promise<MediaWikiEditResult> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const editToken = token || await getEditToken(wikiUrl)

  const formData = new URLSearchParams({
    action: 'edit',
    title,
    text: content,
    token: editToken,
    format: 'json',
    origin: '*'
  })

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to save page')
    }
    
    return data.edit
  } catch (error) {
    console.error('Error saving page:', error)
    throw error
  }
}

/**
 * Delete a page from MediaWiki
 */
export async function deletePage(
  title: string, 
  token?: string, 
  wikiUrl?: string
): Promise<any> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const deleteToken = token || await getEditToken(wikiUrl)

  const formData = new URLSearchParams({
    action: 'delete',
    title,
    token: deleteToken,
    format: 'json',
    origin: '*'
  })

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to delete page')
    }
    
    return data.delete
  } catch (error) {
    console.error('Error deleting page:', error)
    throw error
  }
}

/**
 * List all pages from MediaWiki
 */
export async function listPages(wikiUrl?: string): Promise<string[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    list: 'allpages',
    format: 'json',
    aplimit: '500',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to list pages')
    }
    
    return data?.query?.allpages?.map((page: any) => page.title) || []
  } catch (error) {
    console.error('Error listing pages:', error)
    throw error
  }
}

/**
 * Create a new wiki site using MediaWiki farm's Special:CreateWiki
 */
export async function createWikiSite(subdomain: string, siteName: string): Promise<string> {
  const baseApiUrl = process.env.MEDIAWIKI_API_URL || 'http://13.233.126.84/api.php'
  
  try {
    // First, get a CSRF token for the createwiki action
    const tokenResponse = await fetch(`${baseApiUrl}?action=query&format=json&meta=tokens&type=csrf&origin=*`)
    const tokenData = await tokenResponse.json()
    const csrfToken = tokenData?.query?.tokens?.csrftoken

    if (!csrfToken) {
      throw new Error('Failed to get CSRF token for wiki creation')
    }

    // Call Special:CreateWiki API
    const createWikiParams = new URLSearchParams({
      action: 'createwiki',
      format: 'json',
      token: csrfToken,
      wiki: subdomain,
      language: 'en',
      private: '0', // Public wiki
      origin: '*'
    })

    const createResponse = await fetch(baseApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: createWikiParams
    })

    const createData = await createResponse.json()
    
    if (createData.error) {
      throw new Error(createData.error.info || 'Failed to create wiki')
    }

    // Extract the created wiki URL from the response
    const wikiUrl = createData.createwiki?.url || `${subdomain}.xfanstube.com`
    const apiUrl = `http://${wikiUrl}/api.php`
    
    return apiUrl
  } catch (error) {
    console.error('Error creating wiki site:', error)
    // Fallback to constructed URL if API fails
    const fallbackUrl = getWikiApiUrl(subdomain)
    return fallbackUrl
  }
}

/**
 * Manage an existing wiki using MediaWiki farm's Special:ManageWiki
 */
export async function manageWikiSite(wikiUrl: string, action: 'delete' | 'suspend' | 'activate'): Promise<boolean> {
  const baseApiUrl = process.env.MEDIAWIKI_API_URL || 'http://13.233.126.84/api.php'
  
  try {
    // Get CSRF token
    const tokenResponse = await fetch(`${baseApiUrl}?action=query&format=json&meta=tokens&type=csrf&origin=*`)
    const tokenData = await tokenResponse.json()
    const csrfToken = tokenData?.query?.tokens?.csrftoken

    if (!csrfToken) {
      throw new Error('Failed to get CSRF token for wiki management')
    }

    // Extract wiki name from URL
    const wikiName = wikiUrl.replace('http://', '').replace('https://', '').replace('/api.php', '')

    const manageParams = new URLSearchParams({
      action: 'managewiki',
      format: 'json',
      token: csrfToken,
      wiki: wikiName,
      action_type: action,
      origin: '*'
    })

    const manageResponse = await fetch(baseApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: manageParams
    })

    const manageData = await manageResponse.json()
    
    if (manageData.error) {
      throw new Error(manageData.error.info || `Failed to ${action} wiki`)
    }

    return true
  } catch (error) {
    console.error(`Error managing wiki (${action}):`, error)
    return false
  }
}

/**
 * Create a new page in a wiki
 */
export async function createPage(title: string, content: string, wikiUrl: string): Promise<boolean> {
  try {
    // Get CSRF token
    const tokenResponse = await fetch(`${wikiUrl}?action=query&format=json&meta=tokens&type=csrf&origin=*`)
    const tokenData = await tokenResponse.json()
    const csrfToken = tokenData?.query?.tokens?.csrftoken

    if (!csrfToken) {
      throw new Error('Failed to get CSRF token for page creation')
    }

    const createParams = new URLSearchParams()
    createParams.append('action', 'edit')
    createParams.append('format', 'json')
    createParams.append('title', title)
    createParams.append('text', content)
    createParams.append('token', csrfToken)
    createParams.append('origin', '*')

    const response = await fetch(wikiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: createParams.toString(),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.info || 'Failed to create page')
    }

    console.log(`Successfully created page: ${title}`)
    return true
  } catch (error) {
    console.error('Error creating page:', error)
    return false
  }
}

/**
 * Update an existing page in a wiki
 */
export async function updatePage(title: string, content: string, wikiUrl: string): Promise<boolean> {
  try {
    // Get CSRF token
    const tokenResponse = await fetch(`${wikiUrl}?action=query&format=json&meta=tokens&type=csrf&origin=*`)
    const tokenData = await tokenResponse.json()
    const csrfToken = tokenData?.query?.tokens?.csrftoken

    if (!csrfToken) {
      throw new Error('Failed to get CSRF token for page update')
    }

    const updateParams = new URLSearchParams()
    updateParams.append('action', 'edit')
    updateParams.append('format', 'json')
    updateParams.append('title', title)
    updateParams.append('text', content)
    updateParams.append('token', csrfToken)
    updateParams.append('origin', '*')

    const response = await fetch(wikiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: updateParams.toString(),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.info || 'Failed to update page')
    }

    console.log(`Successfully updated page: ${title}`)
    return true
  } catch (error) {
    console.error('Error updating page:', error)
    return false
  }
}

/**
 * Get wiki information from MediaWiki farm
 */
export async function getWikiInfo(wikiUrl: string): Promise<any> {
  const baseApiUrl = process.env.MEDIAWIKI_API_URL || 'http://13.233.126.84/api.php'
  
  try {
    // Extract wiki name from URL
    const wikiName = wikiUrl.replace('http://', '').replace('https://', '').replace('/api.php', '')

    const infoParams = new URLSearchParams({
      action: 'query',
      format: 'json',
      list: 'wikis',
      wkwiki: wikiName,
      origin: '*'
    })

    const infoResponse = await fetch(`${baseApiUrl}?${infoParams}`)
    const infoData = await infoResponse.json()
    
    if (infoData.error) {
      throw new Error(infoData.error.info || 'Failed to get wiki info')
    }

    return infoData.query?.wikis?.[0] || null
  } catch (error) {
    console.error('Error getting wiki info:', error)
    return null
  }
}

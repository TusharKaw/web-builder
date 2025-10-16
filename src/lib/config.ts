/**
 * Get the base domain for the application
 */
export function getBaseDomain(): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return isDevelopment ? 'localhost:3000' : 'xfanstube.com'
}

/**
 * Get the protocol for the application
 */
export function getProtocol(): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return isDevelopment ? 'http' : 'https'
}

/**
 * Get the full URL for a subdomain
 */
export function getSubdomainUrl(subdomain: string): string {
  const protocol = getProtocol()
  const domain = getBaseDomain()
  return `${protocol}://${subdomain}.${domain}`
}

/**
 * Get the MediaWiki API URL for a subdomain
 */
export function getWikiApiUrl(subdomain: string): string {
  return `${getSubdomainUrl(subdomain)}/api.php`
}

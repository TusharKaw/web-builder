# MediaWiki VisualEditor Integration Guide

## Complete Setup Instructions

### 1. MediaWiki Backend Setup

#### Install VisualEditor Extension
```bash
cd /path/to/mediawiki/extensions
git clone https://gerrit.wikimedia.org/r/mediawiki/extensions/VisualEditor.git
chown -R www-data:www-data VisualEditor
chmod -R 755 VisualEditor
```

#### Install Parsoid
```bash
mkdir -p /opt/parsoid
cd /opt/parsoid
npm install -g parsoid@0.12.1
useradd -r -s /bin/false parsoid
chown -R parsoid:parsoid /opt/parsoid
```

#### Configure Parsoid (`/opt/parsoid/config.yaml`)
```yaml
services:
  - module: lib/index.js
    entrypoint: apiServiceWorker
    conf:
      mwApis:
        - uri: 'http://13.233.126.84/api.php'
          domain: '13.233.126.84'
      cors: true
      allowedDomains:
        - 'localhost:3000'
        - 'app.mysaas.com'
        - '*.mysaas.com'
```

#### MediaWiki LocalSettings.php Configuration
```php
<?php
// VisualEditor Configuration
wfLoadExtension( 'VisualEditor' );

// Enable VisualEditor for all namespaces
$wgVisualEditorNamespaces = [
    NS_MAIN => true,
    NS_USER => true,
    NS_TEMPLATE => true,
    NS_CATEGORY => true
];

// Parsoid configuration
$wgVirtualRestConfig['modules']['parsoid'] = [
    'url' => 'http://localhost:8000',
    'domain' => '13.233.126.84',
    'forwardCookies' => true,
    'restbaseCompat' => false
];

// Enable REST API
$wgEnableRestAPI = true;
$wgRestAPIAdditionalRouteFiles = [
    'extensions/VisualEditor/VisualEditor.php'
];

// CORS configuration for Next.js
$wgCrossSiteAJAXdomains = [
    'localhost:3000',
    'app.mysaas.com',
    '*.mysaas.com'
];

// Enable OAuth2 for authentication
$wgOAuth2Client['client']['id'] = 'your-oauth-client-id';
$wgOAuth2Client['client']['secret'] = 'your-oauth-client-secret';
$wgOAuth2Client['client']['redirect_uri'] = 'http://localhost:3000/auth/mediawiki/callback';

// Session configuration
$wgSessionCacheType = CACHE_DB;
$wgSessionsInObjectCache = true;

// Enable API tokens
$wgEnableAPI = true;
$wgEnableWriteAPI = true;
```

### 2. Next.js Environment Variables

Add to your `.env.local`:

```env
# MediaWiki Integration
MEDIAWIKI_API_URL="http://13.233.126.84/api.php"
MEDIAWIKI_REST_URL="http://13.233.126.84/rest.php/v1"
MEDIAWIKI_OAUTH_CLIENT_ID="your-mediawiki-oauth-client-id"
MEDIAWIKI_OAUTH_CLIENT_SECRET="your-mediawiki-oauth-client-secret"
MEDIAWIKI_OAUTH_REDIRECT_URI="http://localhost:3000/auth/mediawiki/callback"

# Parsoid Configuration
PARSOID_URL="http://localhost:8000"
PARSOID_DOMAIN="13.233.126.84"
```

### 3. Start Services

#### Start Parsoid Service
```bash
# Create systemd service
sudo tee /etc/systemd/system/parsoid.service > /dev/null <<EOF
[Unit]
Description=Parsoid service for VisualEditor
After=network.target

[Service]
Type=simple
User=parsoid
Group=parsoid
WorkingDirectory=/opt/parsoid
ExecStart=/usr/bin/node /opt/parsoid/bin/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable parsoid
sudo systemctl start parsoid
```

#### Start Next.js Development Server
```bash
npm run dev
```

### 4. OAuth2 Setup in MediaWiki

1. Go to `http://13.233.126.84/Special:OAuth2Registration`
2. Create new application:
   - Name: "Next.js Website Builder"
   - Redirect URI: `http://localhost:3000/auth/mediawiki/callback`
   - Scopes: `editpage`, `edit`, `writeapi`
3. Copy Client ID and Secret to your environment variables

### 5. Testing the Integration

#### Test Parsoid
```bash
curl http://localhost:8000/_info
```

#### Test MediaWiki API
```bash
curl "http://13.233.126.84/api.php?action=query&format=json&meta=siteinfo"
```

#### Test VisualEditor
1. Visit any page on your MediaWiki
2. Click "Edit" to open VisualEditor
3. Verify it loads without errors

#### Test Next.js Integration
1. Go to `http://localhost:3000/[username]/[page]/visual-edit`
2. Click "Open Visual Editor"
3. Verify iframe loads MediaWiki VisualEditor
4. Test save functionality

### 6. User Flow

1. **User clicks "Edit Page"** in Next.js app
2. **Redirected to Visual Editor page** (`/[username]/[page]/visual-edit`)
3. **Click "Open Visual Editor"** to launch iframe
4. **VisualEditor loads** from MediaWiki backend
5. **User edits content** using WYSIWYG interface
6. **Save changes** via REST API
7. **Redirect back** to the page

### 7. Security Considerations

- **CSRF Protection**: All edit operations require valid CSRF tokens
- **OAuth2 Authentication**: Secure token-based authentication
- **CORS Configuration**: Restricted to your domains only
- **Session Management**: Proper session handling between Next.js and MediaWiki

### 8. Troubleshooting

#### Common Issues:

1. **Parsoid connection failed**
   - Check if Parsoid is running: `systemctl status parsoid`
   - Verify configuration in `/opt/parsoid/config.yaml`
   - Check logs: `journalctl -u parsoid -f`

2. **CORS errors**
   - Verify CORS configuration in MediaWiki LocalSettings.php
   - Check Parsoid CORS settings
   - Ensure domains match exactly

3. **Authentication issues**
   - Verify OAuth2 client configuration
   - Check redirect URI matches exactly
   - Ensure user has proper permissions

4. **VisualEditor not loading**
   - Check browser console for JavaScript errors
   - Verify Parsoid is accessible from MediaWiki
   - Check MediaWiki error logs

#### Debug Commands:

```bash
# Test Parsoid directly
curl -X POST http://localhost:8000/_api/transform/html/to/wikitext \
  -H "Content-Type: application/json" \
  -d '{"html":"<p>Test content</p>","scrub_wikitext":true}'

# Test MediaWiki API
curl "http://13.233.126.84/api.php?action=query&format=json&meta=siteinfo"

# Test OAuth flow
curl "http://13.233.126.84/rest.php/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/auth/mediawiki/callback&scope=editpage"
```

### 9. Production Deployment

#### For Production:

1. **Use HTTPS** for all communications
2. **Configure proper CORS** for your production domains
3. **Set up SSL certificates** for MediaWiki and Parsoid
4. **Use environment variables** for all sensitive configuration
5. **Enable proper logging** and monitoring
6. **Set up backup** for MediaWiki database

#### Production Environment Variables:
```env
MEDIAWIKI_API_URL="https://backend.mysaas.com/api.php"
MEDIAWIKI_REST_URL="https://backend.mysaas.com/rest.php/v1"
MEDIAWIKI_OAUTH_REDIRECT_URI="https://app.mysaas.com/auth/mediawiki/callback"
PARSOID_URL="https://parsoid.mysaas.com"
```

This integration provides a complete VisualEditor experience within your Next.js website builder platform, allowing users to edit pages using MediaWiki's powerful WYSIWYG interface while maintaining the security and functionality of your existing system.

# MediaWiki VisualEditor + Parsoid Setup Guide

## Prerequisites
- MediaWiki 1.35+ (your current version should work)
- Node.js 14+ for Parsoid
- PHP 7.4+ with required extensions
- Access to MediaWiki installation directory

## Step 1: Install VisualEditor Extension

```bash
# Navigate to MediaWiki extensions directory
cd /path/to/mediawiki/extensions

# Download VisualEditor extension
git clone https://gerrit.wikimedia.org/r/mediawiki/extensions/VisualEditor.git

# Set proper permissions
chown -R www-data:www-data VisualEditor
chmod -R 755 VisualEditor
```

## Step 2: Install Parsoid

```bash
# Create parsoid directory
mkdir -p /opt/parsoid
cd /opt/parsoid

# Install Parsoid via npm
npm install -g parsoid

# Or install specific version
npm install parsoid@0.12.1

# Create parsoid user
useradd -r -s /bin/false parsoid
chown -R parsoid:parsoid /opt/parsoid
```

## Step 3: Configure Parsoid

Create `/opt/parsoid/config.yaml`:

```yaml
services:
  - module: lib/index.js
    entrypoint: apiServiceWorker
    conf:
      mwApis:
        - # This is the URL to your MediaWiki API
          uri: 'http://13.233.126.84/api.php'
          domain: '13.233.126.84'
          # Add your MediaWiki API credentials if needed
          # username: 'your-bot-username'
          # password: 'your-bot-password'
      # Enable CORS for your Next.js domain
      cors: true
      # Allow requests from your Next.js app
      allowedDomains:
        - 'localhost:3000'
        - 'app.mysaas.com'
        - '*.mysaas.com'
```

## Step 4: Configure MediaWiki LocalSettings.php

Add to your MediaWiki `LocalSettings.php`:

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

// Allow REST API from your domains
$wgRestAPIAdditionalRouteFiles[] = 'extensions/VisualEditor/VisualEditor.php';

// Enable VisualEditor for all users
$wgDefaultUserOptions['visualeditor-enable'] = 1;

// VisualEditor preferences
$wgVisualEditorPreferenceModules = [
    'visualeditor-preference' => true
];

// Enable for all namespaces
$wgVisualEditorAvailableNamespaces = [
    NS_MAIN => true,
    NS_USER => true,
    NS_TEMPLATE => true,
    NS_CATEGORY => true
];

// API configuration
$wgAPIModules['visualeditor'] = 'ApiVisualEditor';
$wgAPIModules['visualeditoredit'] = 'ApiVisualEditorEdit';

// Enable OAuth for authentication
$wgOAuth2Client['client']['id'] = 'your-oauth-client-id';
$wgOAuth2Client['client']['secret'] = 'your-oauth-client-secret';
$wgOAuth2Client['client']['redirect_uri'] = 'http://app.mysaas.com/auth/callback';

// Enable session handling
$wgSessionCacheType = CACHE_DB;
$wgSessionsInObjectCache = true;
```

## Step 5: Start Parsoid Service

Create systemd service file `/etc/systemd/system/parsoid.service`:

```ini
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
```

Start the service:

```bash
systemctl daemon-reload
systemctl enable parsoid
systemctl start parsoid
systemctl status parsoid
```

## Step 6: Test Installation

1. **Test Parsoid**: `curl http://localhost:8000/_info`
2. **Test VisualEditor**: Visit any page on your MediaWiki and click "Edit"
3. **Test REST API**: `curl "http://13.233.126.84/api.php?action=query&format=json&meta=siteinfo"`

## Troubleshooting

### Common Issues:

1. **Parsoid connection failed**: Check if Parsoid is running and accessible
2. **CORS errors**: Verify CORS configuration in both MediaWiki and Parsoid
3. **Authentication issues**: Ensure OAuth is properly configured
4. **VisualEditor not loading**: Check browser console for JavaScript errors

### Debug Commands:

```bash
# Check Parsoid logs
journalctl -u parsoid -f

# Test Parsoid directly
curl -X POST http://localhost:8000/_api/transform/html/to/wikitext \
  -H "Content-Type: application/json" \
  -d '{"html":"<p>Test content</p>","scrub_wikitext":true}'

# Test MediaWiki API
curl "http://13.233.126.84/api.php?action=query&format=json&meta=siteinfo"
```

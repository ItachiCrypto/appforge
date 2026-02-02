/**
 * Cloudflare Pages Deployment Service
 * 
 * Deploys user apps to Cloudflare Pages using Direct Upload API.
 * Free tier: 500 builds/month, 100k requests/day
 * 
 * @see https://developers.cloudflare.com/pages/platform/direct-upload/
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'

interface DeploymentResult {
  success: boolean
  url?: string
  deploymentId?: string
  error?: string
}

interface CloudflareResponse<T> {
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: string[]
  result: T
}

interface Project {
  id: string
  name: string
  subdomain: string
  domains: string[]
  created_on: string
}

interface Deployment {
  id: string
  url: string
  environment: string
  deployment_trigger: {
    type: string
  }
  latest_stage: {
    name: string
    status: string
  }
}

/**
 * Get Cloudflare credentials from environment
 */
function getCredentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  
  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare credentials. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.')
  }
  
  return { accountId, apiToken }
}

/**
 * Make authenticated request to Cloudflare API
 */
async function cfFetch<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<CloudflareResponse<T>> {
  const { accountId, apiToken } = getCredentials()
  
  const url = `${CF_API_BASE}/accounts/${accountId}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      ...options.headers,
    },
  })
  
  const data = await response.json() as CloudflareResponse<T>
  
  if (!response.ok || !data.success) {
    const errorMsg = data.errors?.[0]?.message || 'Cloudflare API error'
    throw new Error(errorMsg)
  }
  
  return data
}

/**
 * Create a Cloudflare Pages project if it doesn't exist
 */
async function getOrCreateProject(projectName: string): Promise<Project> {
  // Sanitize project name (lowercase, alphanumeric + hyphens only)
  const sanitizedName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 58) // Max 58 chars
  
  // Try to get existing project
  try {
    const existing = await cfFetch<Project>(`/pages/projects/${sanitizedName}`)
    return existing.result
  } catch {
    // Project doesn't exist, create it
  }
  
  // Create new project
  const response = await cfFetch<Project>('/pages/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: sanitizedName,
      production_branch: 'main',
    }),
  })
  
  return response.result
}

/**
 * Generate a simple index.html wrapper for React apps
 */
function generateIndexHtml(title: string = 'App'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    // App code will be injected here
    INJECT_APP_CODE
  </script>
</body>
</html>`
}

/**
 * Build static files from React code for deployment
 */
function buildStaticFiles(
  files: Record<string, string>,
  appName: string
): Record<string, string> {
  const staticFiles: Record<string, string> = {}
  
  // Find the main App component
  const appFile = files['/App.js'] || files['/App.tsx'] || files['/app.js'] || files['/app.tsx']
  const stylesFile = files['/styles.css'] || files['/index.css'] || ''
  
  if (!appFile) {
    throw new Error('No App.js or App.tsx found in files')
  }
  
  // Convert JSX/TSX to something that can run with Babel standalone
  let appCode = appFile
  
  // Remove import statements (we load React globally)
  appCode = appCode.replace(/^import\s+.*?['"]\s*;?\s*$/gm, '')
  
  // Generate index.html with embedded app
  let indexHtml = generateIndexHtml(appName)
  indexHtml = indexHtml.replace('INJECT_APP_CODE', `
    ${appCode}
    
    // Mount the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  `)
  
  // Add styles if present
  if (stylesFile) {
    indexHtml = indexHtml.replace('</head>', `<style>${stylesFile}</style></head>`)
  }
  
  staticFiles['index.html'] = indexHtml
  
  // Copy other static assets (images, etc.)
  for (const [path, content] of Object.entries(files)) {
    if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i)) {
      staticFiles[path.replace(/^\//, '')] = content
    }
  }
  
  return staticFiles
}

/**
 * Deploy files to Cloudflare Pages using Direct Upload
 */
export async function deployToCloudflare(
  appId: string,
  appName: string,
  files: Record<string, string>
): Promise<DeploymentResult> {
  try {
    const { accountId, apiToken } = getCredentials()
    
    // 1. Create/get project
    const projectName = `appforge-${appId.slice(0, 8)}`
    const project = await getOrCreateProject(projectName)
    
    // 2. Build static files
    const staticFiles = buildStaticFiles(files, appName)
    
    // 3. Create deployment using Direct Upload
    const formData = new FormData()
    
    // Add manifest
    const manifest: Record<string, string> = {}
    
    for (const [path, content] of Object.entries(staticFiles)) {
      const cleanPath = path.replace(/^\//, '')
      const hash = await hashContent(content)
      manifest[`/${cleanPath}`] = hash
      
      // Add file to form data
      const blob = new Blob([content], { type: getMimeType(cleanPath) })
      formData.append(hash, blob, cleanPath)
    }
    
    formData.append('manifest', JSON.stringify(manifest))
    
    // 4. Upload deployment
    const deployResponse = await fetch(
      `${CF_API_BASE}/accounts/${accountId}/pages/projects/${project.name}/deployments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
        body: formData,
      }
    )
    
    const deployData = await deployResponse.json() as CloudflareResponse<Deployment>
    
    if (!deployData.success) {
      throw new Error(deployData.errors?.[0]?.message || 'Deployment failed')
    }
    
    const deployment = deployData.result
    
    // 5. Return deployment URL
    // Format: https://[deployment-id].[project-name].pages.dev
    // Or production: https://[project-name].pages.dev
    const url = deployment.url || `https://${project.name}.pages.dev`
    
    return {
      success: true,
      url,
      deploymentId: deployment.id,
    }
    
  } catch (error) {
    console.error('Cloudflare deployment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
    }
  }
}

/**
 * Hash content for Cloudflare manifest
 */
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'webp': 'image/webp',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

/**
 * Delete a Cloudflare Pages project
 */
export async function deleteProject(appId: string): Promise<boolean> {
  try {
    const projectName = `appforge-${appId.slice(0, 8)}`
    await cfFetch(`/pages/projects/${projectName}`, { method: 'DELETE' })
    return true
  } catch {
    return false
  }
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(
  appId: string, 
  deploymentId: string
): Promise<{ status: string; url?: string }> {
  try {
    const projectName = `appforge-${appId.slice(0, 8)}`
    const response = await cfFetch<Deployment>(
      `/pages/projects/${projectName}/deployments/${deploymentId}`
    )
    
    return {
      status: response.result.latest_stage?.status || 'unknown',
      url: response.result.url,
    }
  } catch (error) {
    return { status: 'error' }
  }
}

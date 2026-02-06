import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

async function main() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('📍 Logging in...');
    await page.goto(`${APP_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.fill('input[name="identifier"]', EMAIL);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(3000);
    await page.fill('input[type="password"]', PASSWORD);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(5000);
    console.log('✅ Logged in');

    // Get current app files
    console.log('\n📡 Fetching current app files...');
    const appData = await page.evaluate(async (appId) => {
      const res = await fetch(`/api/apps/${appId}`);
      if (res.ok) return await res.json();
      return { error: res.status };
    }, APP_ID);
    
    if (appData.error) {
      console.log('❌ Failed to get app:', appData.error);
      return;
    }
    
    const oldFiles = appData.files || {};
    console.log('Current files:', Object.keys(oldFiles).length);
    
    // Flatten the structure - move everything to root
    const newFiles = {};
    
    for (const [path, content] of Object.entries(oldFiles)) {
      // Skip docs, config files
      if (path.includes('/docs/') || path.includes('.md') || path.includes('vite.config') || path.includes('.gitignore')) {
        console.log('Skipping:', path);
        continue;
      }
      
      // Get just the filename
      const filename = path.split('/').pop();
      const newPath = '/' + filename;
      
      // Update imports in the content
      let updatedContent = content;
      
      // Fix imports from ./pages/ and ./components/ and ./hooks/
      updatedContent = updatedContent.replace(/from ['"]\.\/pages\/([^'"]+)['"]/g, "from './$1'");
      updatedContent = updatedContent.replace(/from ['"]\.\/components\/([^'"]+)['"]/g, "from './$1'");
      updatedContent = updatedContent.replace(/from ['"]\.\/hooks\/([^'"]+)['"]/g, "from './$1'");
      
      // Also handle imports like '../components/X'
      updatedContent = updatedContent.replace(/from ['"]\.\.\/components\/([^'"]+)['"]/g, "from './$1'");
      updatedContent = updatedContent.replace(/from ['"]\.\.\/hooks\/([^'"]+)['"]/g, "from './$1'");
      
      newFiles[newPath] = updatedContent;
      console.log(`${path} -> ${newPath}`);
    }
    
    // Add proper index.js entry point
    newFiles['/index.js'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

    // Fix index.html
    newFiles['/index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pacman Experience</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;

    console.log('\n📝 Flattened files:', Object.keys(newFiles).join(', '));
    
    // Update the app
    const updateResult = await page.evaluate(async ({ appId, files }) => {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });
      if (res.ok) return { success: true };
      return { error: res.status, text: await res.text() };
    }, { appId: APP_ID, files: newFiles });
    
    if (updateResult.success) {
      console.log('\n✅ App files updated successfully!');
    } else {
      console.log('❌ Failed to update:', updateResult.error, updateResult.text);
    }
    
    // Navigate to app to verify
    console.log('\n📍 Reloading app...');
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
    
    await page.screenshot({ path: 'screenshots/after-flatten.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);

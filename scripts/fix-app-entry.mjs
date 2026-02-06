import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

// The missing entry point file
const INDEX_JS = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

// Fixed index.html that loads index.js instead of App.js
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pacman Experience</title>
    <link rel="stylesheet" href="/index.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/index.js"></script>
</body>
</html>`;

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
    
    console.log('Current files:', Object.keys(appData.files || {}).join(', '));
    
    // Add the missing files
    const updatedFiles = { ...appData.files };
    updatedFiles['/index.js'] = INDEX_JS;
    updatedFiles['/index.html'] = INDEX_HTML;
    
    // Remove problematic files
    delete updatedFiles['/vite.config.js'];
    delete updatedFiles['vite.config.js'];
    
    console.log('\n📝 Adding index.js entry point...');
    console.log('📝 Updating index.html to load index.js...');
    console.log('📝 Removing vite.config.js...');
    
    // Update the app
    const updateResult = await page.evaluate(async ({ appId, files }) => {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });
      if (res.ok) return { success: true };
      return { error: res.status, text: await res.text() };
    }, { appId: APP_ID, files: updatedFiles });
    
    if (updateResult.success) {
      console.log('\n✅ App files updated successfully!');
      console.log('New files:', Object.keys(updatedFiles).join(', '));
    } else {
      console.log('❌ Failed to update:', updateResult.error, updateResult.text);
    }
    
    // Navigate to app to verify
    console.log('\n📍 Navigating to app to verify...');
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
    
    await page.screenshot({ path: 'screenshots/after-fix.png', fullPage: true });
    console.log('📸 Screenshot saved: after-fix.png');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);

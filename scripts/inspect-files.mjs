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

    // Navigate to app
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);

    // Click on files button
    console.log('📂 Opening file browser...');
    const filesBtn = await page.locator('button:has-text("fichiers")').first();
    await filesBtn.click();
    await page.waitForTimeout(2000);

    // Files to inspect
    const filesToInspect = ['App.js', 'index.html', 'package.json', 'index.js'];
    
    for (const fileName of filesToInspect) {
      console.log(`\n📄 Looking for ${fileName}...`);
      
      // Click on the file
      const fileItem = await page.locator(`button:has-text("${fileName}"), [data-filename="${fileName}"], :text("${fileName}")`).first();
      if (fileItem) {
        try {
          await fileItem.click();
          await page.waitForTimeout(1000);
          
          // Look for code editor content
          const editor = await page.$('.cm-content, .monaco-editor, [class*="editor"], textarea, pre');
          if (editor) {
            const content = await editor.textContent() || await editor.inputValue?.() || '';
            console.log(`\n=== ${fileName} ===`);
            console.log(content.substring(0, 2000));
          }
        } catch (e) {
          console.log(`Could not open ${fileName}: ${e.message}`);
        }
      }
    }

    // Also get files from the API directly
    console.log('\n\n📡 Fetching files from API...');
    
    // Get cookies for auth
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // Make API request
    const apiResponse = await page.evaluate(async (appId) => {
      try {
        const res = await fetch(`/api/apps/${appId}`);
        if (res.ok) {
          return await res.json();
        }
        return { error: res.status };
      } catch (e) {
        return { error: e.message };
      }
    }, APP_ID);
    
    if (apiResponse && !apiResponse.error) {
      console.log('\n✅ Got app data from API');
      console.log('Files:', Object.keys(apiResponse.files || {}).join(', '));
      
      // Print key files
      const files = apiResponse.files || {};
      
      if (files['App.js'] || files['/App.js']) {
        console.log('\n=== App.js (from API) ===');
        console.log((files['App.js'] || files['/App.js']).substring(0, 3000));
      }
      
      if (files['index.html'] || files['/index.html']) {
        console.log('\n=== index.html (from API) ===');
        console.log(files['index.html'] || files['/index.html']);
      }
      
      if (files['package.json'] || files['/package.json']) {
        console.log('\n=== package.json (from API) ===');
        console.log(files['package.json'] || files['/package.json']);
      }
      
      if (files['index.js'] || files['/index.js']) {
        console.log('\n=== index.js (from API) ===');
        console.log((files['index.js'] || files['/index.js']).substring(0, 1000));
      }
    } else {
      console.log('❌ API error:', apiResponse?.error);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);

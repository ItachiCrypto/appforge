import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

async function main() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Capture errors
  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  try {
    // Login
    console.log('📍 Logging in...');
    await page.goto(`${APP_URL}/sign-in`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.fill('input[name="identifier"]', EMAIL);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(3000);
    await page.fill('input[type="password"]', PASSWORD);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(5000);
    console.log('✅ Logged in');
    
    // Navigate to app
    console.log(`\n📍 Navigating to app ${APP_ID}...`);
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000);
    
    console.log('📍 Current URL:', page.url());
    
    // Click on "22 fichiers" to expand file browser
    console.log('\n📂 Expanding file browser...');
    const filesBtn = await page.locator('button:has-text("fichiers"), [class*="files"]').first();
    if (filesBtn) {
      await filesBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/07-files-expanded.png' });
    }
    
    // Try to access the Sandpack iframe console
    console.log('\n🔍 Looking for Sandpack iframe...');
    const iframes = await page.$$('iframe');
    console.log(`Found ${iframes.length} iframes`);
    
    for (let i = 0; i < iframes.length; i++) {
      try {
        const frame = await iframes[i].contentFrame();
        if (frame) {
          const html = await frame.content();
          console.log(`\n=== Iframe ${i} content (first 500 chars) ===`);
          console.log(html.substring(0, 500));
          
          if (html.includes('error') || html.includes('Error')) {
            console.log('\n⚠️ IFRAME CONTAINS ERROR TEXT');
            
            // Look for error messages
            const errorElems = await frame.$$('[class*="error"], [class*="Error"], pre');
            for (const elem of errorElems) {
              const text = await elem.textContent();
              if (text?.trim()) {
                console.log('\n❌ Error element text:', text.trim().substring(0, 500));
              }
            }
          }
        }
      } catch (e) {
        console.log(`Iframe ${i}: Cannot access (cross-origin?)`);
      }
    }
    
    // Print all console logs
    console.log('\n=== ALL Console Logs ===');
    consoleLogs.forEach(log => console.log(log));
    
    // Print errors
    if (errors.length > 0) {
      console.log('\n=== ❌ Page Errors ===');
      errors.forEach(err => console.log(err));
    }
    
    // Try to get WebPreview debug info
    console.log('\n🔍 Looking for WebPreview debug logs...');
    const webPreviewLogs = consoleLogs.filter(log => 
      log.includes('WebPreview') || 
      log.includes('Sandpack') || 
      log.includes('dependencies')
    );
    if (webPreviewLogs.length > 0) {
      console.log('\n=== WebPreview/Sandpack Logs ===');
      webPreviewLogs.forEach(log => console.log(log));
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'screenshots/08-final.png', fullPage: true });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: 'screenshots/error-final.png', fullPage: true });
  }
  
  await browser.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);

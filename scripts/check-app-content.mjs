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
    const appData = await page.evaluate(async (appId) => {
      const res = await fetch(`/api/apps/${appId}`);
      if (res.ok) return await res.json();
      return { error: res.status };
    }, APP_ID);
    
    if (appData.error) {
      console.log('❌ Failed to get app:', appData.error);
      return;
    }
    
    const files = appData.files || {};
    
    console.log('\n📁 All files:', Object.keys(files).join(', '));
    
    console.log('\n=== /App.js ===');
    console.log(files['/App.js'] || files['App.js'] || 'NOT FOUND');
    
    console.log('\n=== /index.js ===');
    console.log(files['/index.js'] || files['index.js'] || 'NOT FOUND');
    
    console.log('\n=== /HomeScreen.js ===');
    console.log((files['/HomeScreen.js'] || files['HomeScreen.js'] || 'NOT FOUND').substring(0, 500));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
}

main().catch(console.error);

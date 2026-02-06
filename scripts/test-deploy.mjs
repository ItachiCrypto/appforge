import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console to check for WebPreview logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('WebPreview') || text.includes('dependencies') || text.includes('sandpackKey')) {
      console.log('🔍', text);
    }
  });

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

    // Navigate to app
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
    
    // Check if WebPreview v2 logs appear
    const webPreviewLogs = logs.filter(l => l.includes('WebPreview'));
    if (webPreviewLogs.length > 0) {
      console.log('\n✅ WebPreview v2 IS DEPLOYED!');
      webPreviewLogs.forEach(l => console.log(l));
    } else {
      console.log('\n❌ WebPreview v2 NOT YET DEPLOYED');
      console.log('No [WebPreview] logs found in', logs.length, 'console messages');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
}

main().catch(console.error);

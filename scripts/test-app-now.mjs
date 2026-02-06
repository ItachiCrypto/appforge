import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('[' + msg.type() + ']', msg.text()));

  try {
    await page.goto(APP_URL + '/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.fill('input[name="identifier"]', EMAIL);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(3000);
    await page.fill('input[type="password"]', PASSWORD);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(5000);
    console.log('Logged in');

    await page.goto(APP_URL + '/app/' + APP_ID, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
    
    await page.screenshot({ path: 'screenshots/test-original-app.png', fullPage: true });
    console.log('Screenshot saved');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await browser.close();
}

main();

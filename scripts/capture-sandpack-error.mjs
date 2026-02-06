import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

async function main() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Capture ALL console messages including from iframes
  page.on('console', msg => console.log(`[PAGE ${msg.type()}]`, msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.toString()));

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
    console.log('\n📍 Navigating to app...');
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(15000);
    
    // Try to get Sandpack iframe and check its content
    console.log('\n🔍 Looking for Sandpack iframe...');
    const iframes = await page.frames();
    console.log(`Found ${iframes.length} frames`);
    
    for (const frame of iframes) {
      const url = frame.url();
      if (url.includes('sandpack') || url.includes('codesandbox')) {
        console.log(`\n📦 Sandpack frame: ${url}`);
        
        try {
          // Get entire HTML content
          const html = await frame.content();
          
          // Look for error indicators
          const errorPatterns = [
            /Could not find[^<]*/g,
            /Error:[^<]*/g,
            /Cannot find module[^<]*/g,
            /Module not found[^<]*/g,
            /Failed to resolve[^<]*/g,
            /SyntaxError[^<]*/g,
            /ReferenceError[^<]*/g,
            /TypeError[^<]*/g,
          ];
          
          for (const pattern of errorPatterns) {
            const matches = html.match(pattern);
            if (matches) {
              console.log('❌ FOUND ERROR:', matches[0].substring(0, 200));
            }
          }
          
          // Get text content of body
          const bodyText = await frame.evaluate(() => document.body?.innerText || '').catch(() => '');
          if (bodyText && bodyText.trim().length > 0 && bodyText.length < 2000) {
            console.log('\n📄 Frame body text:');
            console.log(bodyText);
          }
          
          // Check for error overlay
          const errorOverlay = await frame.$('[class*="error"], [class*="Error"], .sp-error, [data-error]');
          if (errorOverlay) {
            const errorText = await errorOverlay.textContent();
            console.log('\n❌ Error overlay:', errorText);
          }
          
          // Look for pre tags (usually contain stack traces)
          const preTags = await frame.$$eval('pre', els => els.map(e => e.textContent).filter(t => t && t.length < 1000));
          if (preTags.length > 0) {
            console.log('\n📋 Pre tags content:');
            preTags.forEach((text, i) => console.log(`Pre ${i}:`, text));
          }
          
        } catch (e) {
          console.log('Cannot access frame content:', e.message);
        }
      }
    }
    
    // Screenshot
    await page.screenshot({ path: 'screenshots/sandpack-error.png', fullPage: true });
    console.log('\n📸 Screenshot saved');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);

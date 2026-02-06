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
  
  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.toString());
  });

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
    console.log(`\n📍 Navigating to app...`);
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded' });
    
    // Wait longer and capture all logs
    console.log('⏳ Waiting 15 seconds for full render...');
    await page.waitForTimeout(15000);
    
    // Screenshot
    await page.screenshot({ path: 'screenshots/sandpack-debug.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    // Try to access iframe content and check for errors
    const iframes = await page.$$('iframe');
    console.log(`\n🖼️ Found ${iframes.length} iframes`);
    
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i];
      const src = await iframe.getAttribute('src');
      console.log(`Iframe ${i} src: ${src}`);
      
      try {
        const frame = await iframe.contentFrame();
        if (frame) {
          // Get the full HTML
          const html = await frame.content();
          
          // Look for error messages
          if (html.includes('Could not find') || html.includes('Error') || html.includes('error')) {
            console.log('\n⚠️ IFRAME HAS ERRORS:');
            
            // Extract error text
            const errorMatch = html.match(/Could not find[^<]*/);
            if (errorMatch) console.log('Error:', errorMatch[0]);
            
            // Look for pre tags which usually contain errors
            const preContent = await frame.$$eval('pre', els => els.map(e => e.textContent));
            preContent.forEach((text, idx) => {
              if (text && text.length < 1000) {
                console.log(`Pre ${idx}:`, text);
              }
            });
          }
          
          // Check body content
          const bodyText = await frame.$eval('body', el => el.innerText).catch(() => '');
          if (bodyText && bodyText.length < 500 && bodyText.trim()) {
            console.log('Iframe body text:', bodyText.substring(0, 500));
          }
        }
      } catch (e) {
        console.log(`Cannot access iframe ${i}:`, e.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);

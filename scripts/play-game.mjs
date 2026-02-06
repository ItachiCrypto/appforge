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
    console.log('📍 Opening game...');
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    
    // Screenshot home
    await page.screenshot({ path: 'screenshots/game-1-home.png', fullPage: true });
    console.log('📸 Home screen');
    
    // Find the Sandpack iframe and click "Jouer"
    const frames = await page.frames();
    for (const frame of frames) {
      if (frame.url().includes('sandpack') || frame.url().includes('codesandbox')) {
        console.log('🎮 Found game iframe, clicking Jouer...');
        
        // Click the Jouer button
        const jouerBtn = await frame.$('button:has-text("Jouer")');
        if (jouerBtn) {
          await jouerBtn.click();
          await page.waitForTimeout(2000);
          console.log('✅ Clicked Jouer!');
        }
        
        break;
      }
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/game-2-playing.png', fullPage: true });
    console.log('📸 Game screen');
    
    // Try to interact with the game controls
    for (const frame of frames) {
      if (frame.url().includes('sandpack') || frame.url().includes('codesandbox')) {
        // Click some arrow buttons
        const upBtn = await frame.$('button:has-text("⬆️")');
        if (upBtn) {
          await upBtn.click();
          console.log('⬆️ Pressed up');
        }
        
        const rightBtn = await frame.$('button:has-text("➡️")');
        if (rightBtn) {
          await rightBtn.click();
          console.log('➡️ Pressed right');
        }
        
        break;
      }
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/game-3-moved.png', fullPage: true });
    console.log('📸 After moving');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: 'screenshots/game-error.png', fullPage: true });
  }
  
  await browser.close();
  console.log('✅ Done!');
}

main().catch(console.error);

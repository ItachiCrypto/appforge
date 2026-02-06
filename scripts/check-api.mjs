import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture network requests
  page.on('request', req => {
    if (req.url().includes('/api/chat')) {
      console.log('\n📤 CHAT REQUEST:', req.method(), req.url());
      const postData = req.postData();
      if (postData) {
        try {
          const data = JSON.parse(postData);
          console.log('   Model requested:', data.model || 'not specified');
        } catch {}
      }
    }
  });
  
  page.on('response', async res => {
    if (res.url().includes('/api/chat')) {
      console.log('📥 CHAT RESPONSE:', res.status());
    }
  });
  
  // Capture console for model info
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('model') || text.includes('Model') || text.includes('API') || text.includes('anthropic') || text.includes('openai') || text.includes('kimi')) {
      console.log('[console]', text);
    }
  });

  try {
    // Login
    await page.goto(APP_URL + '/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.fill('input[name="identifier"]', EMAIL);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(3000);
    await page.fill('input[type="password"]', PASSWORD);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(5000);
    console.log('✅ Logged in\n');

    // Check settings first
    console.log('📋 Checking user preferences...');
    const prefs = await page.evaluate(async () => {
      const res = await fetch('/api/user/preferences');
      return res.ok ? await res.json() : { error: res.status };
    });
    console.log('User preferences:', JSON.stringify(prefs, null, 2));
    
    // Check user data for API keys
    const userData = await page.evaluate(async () => {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        return {
          hasOpenaiKey: !!data.openaiKey,
          hasAnthropicKey: !!data.anthropicKey,
          hasKimiKey: !!data.kimiKey,
          byokEnabled: data.byokEnabled,
        };
      }
      return { error: res.status };
    });
    console.log('User API keys:', JSON.stringify(userData, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await browser.close();
}

main();

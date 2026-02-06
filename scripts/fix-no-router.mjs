import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

// Simplified App.js without react-router-dom
const NEW_APP_JS = `import React, { useState } from 'react';
import HomeScreen from './HomeScreen';
import GameScreen from './GameScreen';
import TutorialScreen from './TutorialScreen';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const navigate = (page) => setCurrentPage(page);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-800 to-black text-white">
      {currentPage === 'home' && <HomeScreen navigate={navigate} />}
      {currentPage === 'game' && <GameScreen navigate={navigate} />}
      {currentPage === 'tutorial' && <TutorialScreen navigate={navigate} />}
    </div>
  );
}`;

async function main() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('WebPreview')) {
      console.log(`[${msg.type()}]`, msg.text());
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
    
    // Update App.js to not use react-router-dom
    files['/App.js'] = NEW_APP_JS;
    
    // Update HomeScreen to use navigate prop instead of Link
    if (files['/HomeScreen.js']) {
      let homeScreen = files['/HomeScreen.js'];
      // Remove react-router-dom import
      homeScreen = homeScreen.replace(/import.*from ['"]react-router-dom['"];?\\n?/g, '');
      // Replace Link with button that calls navigate
      homeScreen = homeScreen.replace(/<Link to=["']\/game["']>/g, '');
      homeScreen = homeScreen.replace(/<\/Link>/g, '');
      // Add navigate prop
      homeScreen = homeScreen.replace(/export default function HomeScreen\\(\\)/, 'export default function HomeScreen({ navigate })');
      // Make buttons call navigate
      homeScreen = homeScreen.replace(/(<button[^>]*)(>)/g, '$1 onClick={() => navigate("game")}$2');
      files['/HomeScreen.js'] = homeScreen;
      console.log('✅ Updated HomeScreen.js');
    }
    
    // Update GameScreen
    if (files['/GameScreen.js']) {
      let gameScreen = files['/GameScreen.js'];
      gameScreen = gameScreen.replace(/import.*from ['"]react-router-dom['"];?\\n?/g, '');
      gameScreen = gameScreen.replace(/export default function GameScreen\\(\\)/, 'export default function GameScreen({ navigate })');
      files['/GameScreen.js'] = gameScreen;
      console.log('✅ Updated GameScreen.js');
    }
    
    // Update TutorialScreen
    if (files['/TutorialScreen.js']) {
      let tutorialScreen = files['/TutorialScreen.js'];
      tutorialScreen = tutorialScreen.replace(/import.*from ['"]react-router-dom['"];?\\n?/g, '');
      tutorialScreen = tutorialScreen.replace(/export default function TutorialScreen\\(\\)/, 'export default function TutorialScreen({ navigate })');
      files['/TutorialScreen.js'] = tutorialScreen;
      console.log('✅ Updated TutorialScreen.js');
    }
    
    // Remove index.js - let Sandpack handle entry
    delete files['/index.js'];
    
    // Save
    const updateResult = await page.evaluate(async ({ appId, files }) => {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });
      if (res.ok) return { success: true };
      return { error: res.status };
    }, { appId: APP_ID, files });
    
    if (updateResult.success) {
      console.log('\\n✅ Files updated successfully!');
    } else {
      console.log('❌ Failed to update:', updateResult.error);
    }
    
    // Reload and screenshot
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'screenshots/no-router.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
}

main().catch(console.error);

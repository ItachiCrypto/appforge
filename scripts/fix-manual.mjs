import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

// Simple working App without routing
const SIMPLE_APP = `import React, { useState } from 'react';

function HomeScreen({ onPlay, onTutorial }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-5xl font-bold text-yellow-400 mb-8 animate-pulse">
        🎮 PACMAN
      </h1>
      <p className="text-xl text-gray-300 mb-8">Le classique revisité</p>
      <div className="flex gap-4">
        <button 
          onClick={onPlay}
          className="px-8 py-4 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition transform hover:scale-105"
        >
          ▶️ Jouer
        </button>
        <button 
          onClick={onTutorial}
          className="px-8 py-4 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition"
        >
          📖 Tutoriel
        </button>
      </div>
    </div>
  );
}

function GameScreen({ onBack }) {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex justify-between w-full max-w-lg mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white">
          ← Retour
        </button>
        <div className="flex gap-4">
          <span className="text-yellow-400">Score: {score}</span>
          <span className="text-red-400">{"❤️".repeat(lives)}</span>
        </div>
      </div>
      
      <div className="w-80 h-80 bg-blue-900 rounded-lg border-4 border-blue-700 flex items-center justify-center relative overflow-hidden">
        <div className="text-6xl animate-bounce">🟡</div>
        <div className="absolute top-4 left-4 text-3xl">👻</div>
        <div className="absolute bottom-4 right-4 text-3xl">👻</div>
        <div className="absolute top-4 right-4 text-3xl">👻</div>
        
        {/* Dots */}
        <div className="absolute inset-0 grid grid-cols-8 gap-2 p-4 pointer-events-none">
          {Array(64).fill(0).map((_, i) => (
            <div key={i} className="w-2 h-2 bg-white rounded-full opacity-60" />
          ))}
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-3 gap-2">
        <div></div>
        <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => setScore(s => s + 10)}>⬆️</button>
        <div></div>
        <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => setScore(s => s + 10)}>⬅️</button>
        <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => setLives(l => Math.max(0, l - 1))}>⏸️</button>
        <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => setScore(s => s + 10)}>➡️</button>
        <div></div>
        <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => setScore(s => s + 10)}>⬇️</button>
        <div></div>
      </div>
    </div>
  );
}

function TutorialScreen({ onBack }) {
  return (
    <div className="p-8 max-w-lg mx-auto">
      <button onClick={onBack} className="text-gray-400 hover:text-white mb-8">
        ← Retour
      </button>
      <h2 className="text-3xl font-bold text-yellow-400 mb-6">📖 Comment jouer</h2>
      <div className="space-y-4 text-gray-300">
        <p>🎯 <strong>Objectif:</strong> Mangez tous les points sans vous faire attraper!</p>
        <p>⬆️⬇️⬅️➡️ <strong>Contrôles:</strong> Utilisez les flèches pour vous déplacer</p>
        <p>👻 <strong>Fantômes:</strong> Évitez-les ou mangez-les quand ils sont bleus!</p>
        <p>🍒 <strong>Bonus:</strong> Attrapez les fruits pour des points supplémentaires</p>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('home');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {page === 'home' && (
        <HomeScreen 
          onPlay={() => setPage('game')} 
          onTutorial={() => setPage('tutorial')} 
        />
      )}
      {page === 'game' && <GameScreen onBack={() => setPage('home')} />}
      {page === 'tutorial' && <TutorialScreen onBack={() => setPage('home')} />}
    </div>
  );
}`;

async function main() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}]`, msg.text()));

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

    // Update with simple single-file app
    const files = {
      '/App.js': SIMPLE_APP,
    };
    
    console.log('📝 Updating to simple single-file app...');
    
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
      console.log('✅ Files updated!');
    } else {
      console.log('❌ Failed:', updateResult.error);
    }
    
    // Reload and screenshot
    await page.goto(`${APP_URL}/app/${APP_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'screenshots/simple-app.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  await browser.close();
}

main().catch(console.error);

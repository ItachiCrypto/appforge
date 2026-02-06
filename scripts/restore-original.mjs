import { chromium } from 'playwright';

const APP_URL = 'https://startup-azure-nine.vercel.app';
const APP_ID = 'cmlb8n1n70003145g8th9inot';
const EMAIL = 'infos.zetsu@gmail.com';
const PASSWORD = 'infos.zetsu@gmail.com';

// Original LLM-generated files
const ORIGINAL_FILES = {
  '/App.js': `import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomeScreen from './pages/HomeScreen';
import GameScreen from './pages/GameScreen';
import TutorialScreen from './pages/TutorialScreen';
import Header from './components/Header';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/game" element={<GameScreen />} />
            <Route path="/tutorial" element={<TutorialScreen />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}`,

  '/pages/HomeScreen.js': `import React from 'react';
import { Link } from 'react-router-dom';

export default function HomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
      <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent mb-4 animate-pulse">
        PACMAN
      </h1>
      <p className="text-xl text-gray-400 mb-12">Le classique revisité</p>
      
      <div className="flex flex-col gap-4 w-64">
        <Link to="/game">
          <button className="w-full px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-xl shadow-lg hover:shadow-yellow-500/25 transition-all transform hover:scale-105">
            Jouer
          </button>
        </Link>
        <Link to="/tutorial">
          <button className="w-full px-8 py-4 bg-gray-700/50 text-white font-semibold rounded-xl border border-gray-600 hover:bg-gray-700 transition-all">
            Tutoriel
          </button>
        </Link>
      </div>
    </div>
  );
}`,

  '/pages/GameScreen.js': `import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import ScoreDisplay from '../components/ScoreDisplay';

export default function GameScreen() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [pacmanPos, setPacmanPos] = useState({ x: 5, y: 5 });
  
  const handleKeyPress = useCallback((e) => {
    if (gameOver) return;
    
    const moves = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
    
    if (moves[e.key]) {
      setPacmanPos(prev => ({
        x: Math.max(0, Math.min(9, prev.x + moves[e.key].x)),
        y: Math.max(0, Math.min(9, prev.y + moves[e.key].y)),
      }));
      setScore(s => s + 10);
    }
  }, [gameOver]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex justify-between w-full max-w-lg mb-4">
        <Link to="/" className="text-gray-400 hover:text-white transition">
          Retour
        </Link>
        <ScoreDisplay score={score} lives={lives} />
      </div>
      
      <GameBoard pacmanPos={pacmanPos} />
      
      {gameOver && (
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold text-red-500 mb-4">Game Over!</h2>
          <p className="text-xl text-gray-400 mb-4">Score final: {score}</p>
          <button 
            onClick={() => { setScore(0); setLives(3); setGameOver(false); setPacmanPos({x:5,y:5}); }}
            className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg"
          >
            Rejouer
          </button>
        </div>
      )}
      
      <p className="mt-8 text-gray-500 text-sm">Utilisez les fleches du clavier pour jouer</p>
    </div>
  );
}`,

  '/pages/TutorialScreen.js': `import React from 'react';
import { Link } from 'react-router-dom';

export default function TutorialScreen() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link to="/" className="text-gray-400 hover:text-white transition mb-8 inline-block">
        Retour
      </Link>
      
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">Comment jouer</h1>
      
      <div className="space-y-6 text-lg">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-yellow-300 mb-2">Objectif</h3>
          <p className="text-gray-300">Mangez tous les points sans vous faire attraper par les fantomes!</p>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-yellow-300 mb-2">Controles</h3>
          <p className="text-gray-300">Utilisez les fleches du clavier pour vous deplacer</p>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-yellow-300 mb-2">Fantomes</h3>
          <p className="text-gray-300">Evitez les fantomes ou mangez-les quand ils sont bleus!</p>
        </div>
      </div>
      
      <Link to="/game">
        <button className="mt-8 w-full px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-xl">
          Commencer
        </button>
      </Link>
    </div>
  );
}`,

  '/components/Header.js': `import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link to="/" className="text-2xl font-bold text-yellow-400 hover:text-yellow-300 transition">
          Pacman
        </Link>
        <nav className="flex gap-6">
          <Link to="/game" className="text-gray-300 hover:text-white transition">Jouer</Link>
          <Link to="/tutorial" className="text-gray-300 hover:text-white transition">Tutoriel</Link>
        </nav>
      </div>
    </header>
  );
}`,

  '/components/GameBoard.js': `import React from 'react';

export default function GameBoard({ pacmanPos }) {
  const GRID_SIZE = 10;
  
  return (
    <div className="bg-blue-900 rounded-xl p-4 border-4 border-blue-700 shadow-2xl">
      <div className="grid grid-cols-10 gap-1">
        {Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isPacman = pacmanPos.x === x && pacmanPos.y === y;
          
          return (
            <div key={i} className="w-8 h-8 flex items-center justify-center">
              {isPacman ? (
                <div className="w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
              ) : (
                <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}`,

  '/components/ScoreDisplay.js': `import React from 'react';

export default function ScoreDisplay({ score, lives }) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-yellow-400 font-bold">
        Score: <span className="text-white">{score}</span>
      </div>
      <div className="text-red-400 flex gap-1">
        {Array(lives).fill(null).map((_, i) => (
          <span key={i}>*</span>
        ))}
      </div>
    </div>
  );
}`,

  '/index.css': `body { margin: 0; font-family: system-ui, sans-serif; }`,

  '/package.json': `{
  "name": "pacman",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.20.0"
  }
}`,
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Logging in...');
    await page.goto(APP_URL + '/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.fill('input[name="identifier"]', EMAIL);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(3000);
    await page.fill('input[type="password"]', PASSWORD);
    await page.locator('button:has-text("CONTINUE"):visible').click();
    await page.waitForTimeout(5000);
    console.log('Logged in!');

    console.log('Restoring original files...');
    
    const result = await page.evaluate(async ({ appId, files }) => {
      const res = await fetch('/api/apps/' + appId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });
      return res.ok ? { success: true } : { error: res.status };
    }, { appId: APP_ID, files: ORIGINAL_FILES });
    
    if (result.success) {
      console.log('Files restored:', Object.keys(ORIGINAL_FILES).join(', '));
    } else {
      console.log('Failed:', result.error);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await browser.close();
}

main();

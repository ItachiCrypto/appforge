# SKILLS.md - Guide de Génération de Code AppForge

Tu es un expert React/TypeScript qui génère des applications de qualité production.

## 🎯 Objectif Principal

Générer du code qui fait dire "WOW" aux utilisateurs. Chaque app doit:
1. Être visuellement impressionnante (pas un prototype basique)
2. Fonctionner parfaitement dès le premier rendu
3. Avoir des données pré-remplies pour une démo immédiate
4. Inclure des micro-interactions et animations

---

## 📐 Architecture Standard

### Structure de Fichier App.js
```jsx
import React, { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
// DONNÉES INITIALES (TOUJOURS PRÉ-REMPLIR!)
// ═══════════════════════════════════════════════════════════════
const INITIAL_DATA = [
  // Exemples réalistes, pas "Lorem ipsum"
];

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS RÉUTILISABLES
// ═══════════════════════════════════════════════════════════════
function Button({ children, variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };
  return (
    <button 
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 ${className}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function App() {
  // États
  const [data, setData] = useState(INITIAL_DATA);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Persistence localStorage
  useEffect(() => {
    const saved = localStorage.getItem('app-data');
    if (saved) setData(JSON.parse(saved));
  }, []);
  
  useEffect(() => {
    localStorage.setItem('app-data', JSON.stringify(data));
  }, [data]);
  
  // Render
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
        {/* Header, Content, etc. */}
      </div>
    </div>
  );
}
```

---

## 🎨 Patterns de Design Obligatoires

### 1. Gradients de Fond (pas de fond uni ennuyeux)
```css
/* Hero/Header gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Dark mode board (Kanban, etc.) */
background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);

/* Subtle page background */
background: linear-gradient(to bottom right, #f8fafc, #f1f5f9);
```

### 2. Glassmorphism pour Cartes/Modals
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
}
```

### 3. Shadows Modernes (pas de shadow-sm basique)
```css
/* Card shadow */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Elevated card hover */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### 4. Animations Micro-interactions
```css
/* Hover lift */
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* Button press */
.button:active {
  transform: scale(0.95);
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.3s ease-out; }

/* Slide in from left */
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
```

---

## 🔄 Drag & Drop Natif (CRITIQUE pour Kanban)

```jsx
// Sur l'élément draggable
<div
  draggable="true"
  onDragStart={(e) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(item);
    e.currentTarget.classList.add('opacity-50', 'scale-105');
  }}
  onDragEnd={(e) => {
    e.currentTarget.classList.remove('opacity-50', 'scale-105');
    setDraggedItem(null);
  }}
  className="cursor-grab active:cursor-grabbing"
>

// Sur la drop zone
<div
  onDragOver={(e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(target.id);
  }}
  onDragLeave={() => setDragOverTarget(null)}
  onDrop={(e) => {
    e.preventDefault();
    handleDrop(draggedItem, target);
    setDragOverTarget(null);
  }}
  className={dragOverTarget === target.id ? 'bg-indigo-100 border-2 border-dashed border-indigo-400' : ''}
>
```

---

## 📱 Modal Pattern (TOUJOURS inclure si édition)

```jsx
{showModal && (
  <div 
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={() => setShowModal(false)}
  >
    <div 
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
        <h2 className="text-xl font-bold">Titre du Modal</h2>
        <button 
          onClick={() => setShowModal(false)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
        >
          ✕
        </button>
      </div>
      
      {/* Body */}
      <div className="p-6">
        {/* Contenu */}
      </div>
      
      {/* Footer */}
      <div className="flex justify-end gap-3 p-6 border-t dark:border-slate-700">
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Annuler
        </Button>
        <Button onClick={handleSave}>
          Sauvegarder
        </Button>
      </div>
    </div>
  </div>
)}
```

---

## 🌙 Dark Mode Pattern

```jsx
const [isDarkMode, setIsDarkMode] = useState(() => {
  const saved = localStorage.getItem('darkMode');
  return saved ? JSON.parse(saved) : false;
});

useEffect(() => {
  localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
}, [isDarkMode]);

// Toggle button
<button
  onClick={() => setIsDarkMode(!isDarkMode)}
  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
>
  {isDarkMode ? '☀️' : '🌙'}
</button>

// Root wrapper
<div className={isDarkMode ? 'dark' : ''}>
  <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors">
```

---

## 💾 localStorage Persistence Pattern

```jsx
// Clé unique par app
const STORAGE_KEY = 'appforge-kanban-data';

// Charger au mount
useEffect(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Valider les données avant de les utiliser
      if (Array.isArray(parsed)) {
        setData(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to load saved data:', e);
  }
}, []);

// Sauvegarder à chaque changement
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}, [data]);
```

---

## 📊 Stat Cards Pattern

```jsx
function StatCard({ icon, label, value, trend, trendUp }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <span className={`text-sm font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}

// Usage
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard icon="📊" label="Total Projets" value="12" trend="+2" trendUp />
  <StatCard icon="✅" label="Tâches Terminées" value="48" trend="+12" trendUp />
  <StatCard icon="⏱️" label="Heures Loggées" value="164h" />
  <StatCard icon="👥" label="Membres Actifs" value="8" />
</div>
```

---

## ⚠️ Erreurs Communes à Éviter

### ❌ NE PAS FAIRE
```jsx
// Empty state ennuyeux
{items.length === 0 && <p>Aucun élément</p>}

// Prompt() pour l'input utilisateur
const name = prompt('Nom?');

// Données vides au démarrage
const [data, setData] = useState([]);

// Couleurs ternes
className="bg-gray-100"
```

### ✅ FAIRE
```jsx
// Empty state engageant
{items.length === 0 && (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📭</div>
    <h3 className="text-xl font-semibold mb-2">Aucune tâche</h3>
    <p className="text-gray-500 mb-4">Commence par créer ta première tâche!</p>
    <Button onClick={() => setShowAddModal(true)}>+ Créer une tâche</Button>
  </div>
)}

// Modal pour l'input
{showAddModal && <AddItemModal onSubmit={handleAdd} onClose={() => setShowAddModal(false)} />}

// Données de démonstration
const [data, setData] = useState(DEMO_DATA);

// Couleurs vibrantes
className="bg-gradient-to-r from-indigo-500 to-purple-600"
```

---

## 🎯 Checklist Finale

Avant de terminer, vérifie:
- [ ] Données initiales pré-remplies (au moins 3-5 items)
- [ ] Dark mode toggle fonctionnel
- [ ] localStorage persistence
- [ ] Animations sur les interactions
- [ ] Modals pour édition (pas de prompt())
- [ ] Empty states avec illustrations/emojis
- [ ] Hover effects sur tous les éléments cliquables
- [ ] Responsive (mobile-first)
- [ ] Minimum 300+ lignes de code

---

## 📝 Template de Base Minimal

```jsx
import React, { useState, useEffect } from 'react';

const INITIAL_DATA = [
  { id: '1', title: 'Premier élément', done: false },
  { id: '2', title: 'Deuxième élément', done: true },
  { id: '3', title: 'Troisième élément', done: false },
];

export default function App() {
  const [items, setItems] = useState(INITIAL_DATA);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // localStorage persistence
  useEffect(() => {
    const saved = localStorage.getItem('my-app-data');
    if (saved) setItems(JSON.parse(saved));
    const dark = localStorage.getItem('my-app-dark');
    if (dark) setIsDarkMode(JSON.parse(dark));
  }, []);
  
  useEffect(() => {
    localStorage.setItem('my-app-data', JSON.stringify(items));
  }, [items]);
  
  useEffect(() => {
    localStorage.setItem('my-app-dark', JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 transition-all">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">✨ Mon App</h1>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
          
          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
            {items.map(item => (
              <div 
                key={item.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl mb-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => setItems(items.map(i => 
                    i.id === item.id ? {...i, done: !i.done} : i
                  ))}
                  className="w-5 h-5 rounded"
                />
                <span className={item.done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

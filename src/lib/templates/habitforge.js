// HabitForge - Clone de Habit Tracker Apps
// Économie: 60€/an vs Streaks/Habitify Pro

const { useState, useEffect } = React

const HABIT_ICONS = ['💪', '📚', '🏃', '💧', '🧘', '🎯', '✍️', '🎨', '🎸', '💤', '🥗', '💊', '☀️', '🚭', '📱']
const HABIT_COLORS = [
  { id: 'red', bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600' },
  { id: 'orange', bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600' },
  { id: 'yellow', bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-600' },
  { id: 'green', bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
  { id: 'blue', bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
  { id: 'purple', bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600' },
  { id: 'pink', bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-600' },
]

export default function App() {
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({}) // { habitId: { 'YYYY-MM-DD': true } }
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState(null)
  const [newHabit, setNewHabit] = useState({
    name: '',
    icon: '💪',
    color: 'blue',
    frequency: 'daily', // daily, weekdays, custom
    targetDays: [1, 2, 3, 4, 5, 6, 7],
  })

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('habitforge-data')
    if (saved) {
      const data = JSON.parse(saved)
      setHabits(data.habits || [])
      setCompletions(data.completions || {})
    }
  }, [])

  // Save data
  useEffect(() => {
    localStorage.setItem('habitforge-data', JSON.stringify({ habits, completions }))
  }, [habits, completions])

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0]
  }

  const todayKey = formatDateKey(new Date())
  const selectedKey = formatDateKey(selectedDate)

  const addHabit = () => {
    if (!newHabit.name.trim()) return
    
    const habit = {
      id: Date.now().toString(),
      ...newHabit,
      createdAt: new Date().toISOString(),
    }
    
    setHabits([...habits, habit])
    setCompletions({ ...completions, [habit.id]: {} })
    setNewHabit({
      name: '',
      icon: '💪',
      color: 'blue',
      frequency: 'daily',
      targetDays: [1, 2, 3, 4, 5, 6, 7],
    })
    setShowAddHabit(false)
  }

  const toggleCompletion = (habitId, dateKey) => {
    setCompletions(prev => ({
      ...prev,
      [habitId]: {
        ...prev[habitId],
        [dateKey]: !prev[habitId]?.[dateKey]
      }
    }))
  }

  const deleteHabit = (habitId) => {
    setHabits(habits.filter(h => h.id !== habitId))
    const newCompletions = { ...completions }
    delete newCompletions[habitId]
    setCompletions(newCompletions)
    setSelectedHabit(null)
  }

  const getStreak = (habitId) => {
    const habitCompletions = completions[habitId] || {}
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = formatDateKey(date)
      
      if (habitCompletions[key]) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    
    return streak
  }

  const getTotalCompletions = (habitId) => {
    const habitCompletions = completions[habitId] || {}
    return Object.values(habitCompletions).filter(Boolean).length
  }

  const getCompletionRate = (habitId) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return 0
    
    const habitCompletions = completions[habitId] || {}
    const createdDate = new Date(habit.createdAt)
    const today = new Date()
    const daysSinceCreation = Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24))
    const totalCompletions = Object.values(habitCompletions).filter(Boolean).length
    
    return daysSinceCreation > 0 ? Math.round((totalCompletions / daysSinceCreation) * 100) : 0
  }

  // Generate last 7 days
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date)
    }
    return days
  }

  // Generate calendar month
  const getCalendarDays = () => {
    const days = []
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Add padding for first week
    const startPadding = (firstDay.getDay() + 6) % 7 // Adjust for Monday start
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }
    
    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const last7Days = getLast7Days()
  const calendarDays = getCalendarDays()
  
  const todayCompleted = habits.filter(h => completions[h.id]?.[todayKey]).length
  const todayTotal = habits.length

  const getColor = (colorId) => HABIT_COLORS.find(c => c.id === colorId) || HABIT_COLORS[4]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <h1 className="text-xl font-bold text-white">HabitForge</h1>
              <p className="text-xs text-white/50">Clone Habit Tracker • 60€/an économisés</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddHabit(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium backdrop-blur transition-colors"
          >
            + Habitude
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Today's Progress */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white text-lg font-semibold">Aujourd'hui</h2>
              <p className="text-white/60 text-sm">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                {todayCompleted}/{todayTotal}
              </p>
              <p className="text-white/60 text-sm">complétées</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${todayTotal ? (todayCompleted / todayTotal) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <p className="text-6xl mb-4">🎯</p>
            <p className="text-xl text-white font-medium">Aucune habitude</p>
            <p className="text-white/60 mt-2">Créez votre première habitude pour commencer</p>
            <button
              onClick={() => setShowAddHabit(true)}
              className="mt-6 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium"
            >
              + Créer une habitude
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => {
              const color = getColor(habit.color)
              const isCompletedToday = completions[habit.id]?.[todayKey]
              const streak = getStreak(habit.id)
              
              return (
                <div
                  key={habit.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
                >
                  <div className="p-4 flex items-center gap-4">
                    {/* Complete button */}
                    <button
                      onClick={() => toggleCompletion(habit.id, todayKey)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                        isCompletedToday 
                          ? `${color.bg} scale-110` 
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      {isCompletedToday ? '✓' : habit.icon}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isCompletedToday ? 'text-white/60 line-through' : 'text-white'}`}>
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        {streak > 0 && (
                          <span className="text-xs text-orange-400 flex items-center gap-1">
                            🔥 {streak} jour{streak > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-xs text-white/50">
                          {getTotalCompletions(habit.id)} total
                        </span>
                      </div>
                    </div>
                    
                    {/* Week view */}
                    <div className="hidden sm:flex items-center gap-1">
                      {last7Days.map((date, i) => {
                        const key = formatDateKey(date)
                        const completed = completions[habit.id]?.[key]
                        const isToday = key === todayKey
                        
                        return (
                          <button
                            key={i}
                            onClick={() => toggleCompletion(habit.id, key)}
                            className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all ${
                              completed 
                                ? color.bg 
                                : isToday 
                                  ? 'bg-white/30 ring-2 ring-white/50' 
                                  : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            {completed ? '✓' : date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Details button */}
                    <button
                      onClick={() => setSelectedHabit(habit)}
                      className="text-white/50 hover:text-white p-2"
                    >
                      📊
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Statistics Overview */}
        {habits.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-white/60 text-sm">Total habitudes</p>
              <p className="text-2xl font-bold text-white">{habits.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-white/60 text-sm">Aujourd'hui</p>
              <p className="text-2xl font-bold text-white">
                {todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0}%
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-white/60 text-sm">Meilleure streak</p>
              <p className="text-2xl font-bold text-orange-400">
                🔥 {Math.max(...habits.map(h => getStreak(h.id)), 0)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-white/60 text-sm">Total completions</p>
              <p className="text-2xl font-bold text-green-400">
                {habits.reduce((sum, h) => sum + getTotalCompletions(h.id), 0)}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-white/20">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Nouvelle habitude</h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Nom de l'habitude</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Faire 30 min de sport"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Icône</label>
                <div className="flex flex-wrap gap-2">
                  {HABIT_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewHabit({ ...newHabit, icon })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        newHabit.icon === icon 
                          ? 'bg-purple-500 scale-110' 
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Couleur</label>
                <div className="flex gap-2">
                  {HABIT_COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setNewHabit({ ...newHabit, color: color.id })}
                      className={`w-10 h-10 rounded-lg ${color.bg} transition-all ${
                        newHabit.color === color.id ? 'scale-110 ring-2 ring-white' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowAddHabit(false)}
                className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20"
              >
                Annuler
              </button>
              <button
                onClick={addHabit}
                className="flex-1 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit Detail Modal */}
      {selectedHabit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-gray-900">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${getColor(selectedHabit.color).bg} rounded-xl flex items-center justify-center text-2xl`}>
                  {selectedHabit.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedHabit.name}</h3>
                  <p className="text-white/60 text-sm">
                    Créée le {new Date(selectedHabit.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHabit(null)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Stats */}
            <div className="p-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-400">🔥 {getStreak(selectedHabit.id)}</p>
                <p className="text-white/60 text-sm">Streak actuel</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{getTotalCompletions(selectedHabit.id)}</p>
                <p className="text-white/60 text-sm">Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{getCompletionRate(selectedHabit.id)}%</p>
                <p className="text-white/60 text-sm">Taux</p>
              </div>
            </div>
            
            {/* Calendar */}
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    newDate.setMonth(newDate.getMonth() - 1)
                    setSelectedDate(newDate)
                  }}
                  className="text-white/60 hover:text-white"
                >
                  ←
                </button>
                <p className="text-white font-medium">
                  {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    newDate.setMonth(newDate.getMonth() + 1)
                    setSelectedDate(newDate)
                  }}
                  className="text-white/60 hover:text-white"
                >
                  →
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <div key={i} className="text-xs text-white/40 py-2">{d}</div>
                ))}
                
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={i} />
                  
                  const key = formatDateKey(date)
                  const completed = completions[selectedHabit.id]?.[key]
                  const isToday = key === todayKey
                  const isFuture = date > new Date()
                  
                  return (
                    <button
                      key={i}
                      onClick={() => !isFuture && toggleCompletion(selectedHabit.id, key)}
                      disabled={isFuture}
                      className={`aspect-square rounded-lg text-sm flex items-center justify-center transition-all ${
                        completed 
                          ? getColor(selectedHabit.color).bg + ' text-white' 
                          : isFuture
                            ? 'text-white/20'
                            : isToday
                              ? 'bg-white/20 text-white'
                              : 'text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {completed ? '✓' : date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => deleteHabit(selectedHabit.id)}
                className="w-full py-3 text-red-400 hover:bg-red-500/20 rounded-lg font-medium"
              >
                🗑️ Supprimer cette habitude
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// TaskFlow - Clone de Todoist
// Économie: 48€/an vs Todoist Pro

const { useState, useEffect } = React

const PRIORITIES = [
  { id: 1, name: 'Urgent', color: 'bg-red-500', textColor: 'text-red-500' },
  { id: 2, name: 'Haute', color: 'bg-orange-500', textColor: 'text-orange-500' },
  { id: 3, name: 'Moyenne', color: 'bg-blue-500', textColor: 'text-blue-500' },
  { id: 4, name: 'Basse', color: 'bg-gray-400', textColor: 'text-gray-400' },
]

const DEFAULT_PROJECTS = [
  { id: 'inbox', name: 'Boîte de réception', icon: '📥', color: 'blue' },
  { id: 'personal', name: 'Personnel', icon: '👤', color: 'purple' },
  { id: 'work', name: 'Travail', icon: '💼', color: 'green' },
]

export default function App() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState(DEFAULT_PROJECTS)
  const [selectedProject, setSelectedProject] = useState('inbox')
  const [selectedView, setSelectedView] = useState('all')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: 'inbox',
    priority: 4,
    dueDate: '',
  })
  const [newProjectName, setNewProjectName] = useState('')

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('taskflow-data')
    if (saved) {
      const data = JSON.parse(saved)
      setTasks(data.tasks || [])
      setProjects(data.projects || DEFAULT_PROJECTS)
    }
  }, [])

  // Save data
  useEffect(() => {
    localStorage.setItem('taskflow-data', JSON.stringify({ tasks, projects }))
  }, [tasks, projects])

  const addTask = () => {
    if (!newTask.title.trim()) return
    
    const task = {
      id: Date.now().toString(),
      ...newTask,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    
    setTasks([...tasks, task])
    setNewTask({
      title: '',
      description: '',
      projectId: selectedProject === 'all' ? 'inbox' : selectedProject,
      priority: 4,
      dueDate: '',
    })
    setShowAddTask(false)
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const addProject = () => {
    if (!newProjectName.trim()) return
    const project = {
      id: Date.now().toString(),
      name: newProjectName,
      icon: '📁',
      color: 'gray',
    }
    setProjects([...projects, project])
    setNewProjectName('')
    setShowAddProject(false)
  }

  // Filter tasks
  const getFilteredTasks = () => {
    let filtered = tasks

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === selectedProject)
    }

    // View filter
    if (selectedView === 'today') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(t => t.dueDate === today)
    } else if (selectedView === 'upcoming') {
      const today = new Date()
      filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) > today)
    }

    // Sort by priority, then by due date
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.priority !== b.priority) return a.priority - b.priority
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate)
      return 0
    })
  }

  const filteredTasks = getFilteredTasks()
  const completedCount = tasks.filter(t => t.completed).length
  const pendingCount = tasks.filter(t => !t.completed).length

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().toDateString())
  }

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <span className="text-2xl">✅</span> TaskFlow
          </h1>
          <p className="text-xs text-gray-500 mt-1">Clone de Todoist • 48€/an économisés</p>
        </div>

        {/* Quick filters */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => { setSelectedView('all'); setSelectedProject('all'); }}
            className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 ${
              selectedView === 'all' && selectedProject === 'all' 
                ? 'bg-red-50 text-red-700' 
                : 'hover:bg-gray-100'
            }`}
          >
            <span>📋</span>
            <span className="flex-1">Toutes</span>
            <span className="text-sm text-gray-500">{pendingCount}</span>
          </button>
          <button
            onClick={() => setSelectedView('today')}
            className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 ${
              selectedView === 'today' ? 'bg-red-50 text-red-700' : 'hover:bg-gray-100'
            }`}
          >
            <span>📅</span>
            <span className="flex-1">Aujourd'hui</span>
            <span className="text-sm text-gray-500">
              {tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0] && !t.completed).length}
            </span>
          </button>
          <button
            onClick={() => setSelectedView('upcoming')}
            className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 ${
              selectedView === 'upcoming' ? 'bg-red-50 text-red-700' : 'hover:bg-gray-100'
            }`}
          >
            <span>📆</span>
            <span>À venir</span>
          </button>
        </div>

        {/* Projects */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider flex justify-between items-center">
            <span>Projets</span>
            <button 
              onClick={() => setShowAddProject(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              +
            </button>
          </div>
          
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => { setSelectedProject(project.id); setSelectedView('all'); }}
              className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                selectedProject === project.id && selectedView === 'all'
                  ? 'bg-gray-100 font-medium' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <span>{project.icon}</span>
              <span className="flex-1">{project.name}</span>
              <span className="text-sm text-gray-400">
                {tasks.filter(t => t.projectId === project.id && !t.completed).length}
              </span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Complétées</span>
            <span className="font-medium text-green-600">{completedCount}</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {selectedView === 'today' ? "Aujourd'hui" : 
               selectedView === 'upcoming' ? 'À venir' : 
               selectedProject === 'all' ? 'Toutes les tâches' :
               projects.find(p => p.id === selectedProject)?.name}
            </h2>
            <p className="text-sm text-gray-500">
              {filteredTasks.filter(t => !t.completed).length} tâche(s) restante(s)
            </p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>+</span> Ajouter une tâche
          </button>
        </header>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-6xl mb-4">🎉</p>
              <p className="text-xl font-medium">Aucune tâche</p>
              <p className="text-sm mt-2">Profitez de votre journée !</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-2">
              {filteredTasks.map(task => {
                const priority = PRIORITIES.find(p => p.id === task.priority)
                const project = projects.find(p => p.id === task.projectId)
                const overdue = isOverdue(task.dueDate) && !task.completed
                
                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-lg border p-4 flex items-start gap-3 group hover:shadow-md transition-shadow ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        task.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : `border-current ${priority?.textColor} hover:bg-gray-100`
                      }`}
                    >
                      {task.completed && <span className="text-xs">✓</span>}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-gray-400 flex items-center gap-1">
                          {project?.icon} {project?.name}
                        </span>
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
                            📅 {formatDueDate(task.dueDate)}
                            {overdue && ' (en retard)'}
                          </span>
                        )}
                        <span className={`${priority?.textColor}`}>
                          P{task.priority}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      🗑️
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold">Nouvelle tâche</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <input
                type="text"
                placeholder="Titre de la tâche"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
                autoFocus
              />
              
              <textarea
                placeholder="Description (optionnel)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={2}
              />
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Projet</label>
                  <select
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Priorité</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.id} value={p.id}>P{p.id} - {p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Échéance</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={addTask}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Nouveau projet</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Nom du projet"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAddProject(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={addProject}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

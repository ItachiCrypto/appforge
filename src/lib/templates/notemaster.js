// NoteMaster - Clone de Notion
// Économie: 96€/an vs Notion Personal Pro

const { useState, useEffect } = React

// Simple Markdown Parser
function parseMarkdown(text) {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1 rounded text-pink-600">$1</code>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
    .replace(/\n/gim, '<br>')
}

export default function App() {
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([{ id: 'default', name: 'Mes Notes', icon: '📁' }])
  const [selectedNote, setSelectedNote] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState('default')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notemaster-data')
    if (saved) {
      const data = JSON.parse(saved)
      setNotes(data.notes || [])
      setFolders(data.folders || [{ id: 'default', name: 'Mes Notes', icon: '📁' }])
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('notemaster-data', JSON.stringify({ notes, folders }))
  }, [notes, folders])

  const createNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Nouvelle note',
      content: '# Ma nouvelle note\n\nCommencez à écrire ici...',
      folderId: selectedFolder,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setNotes([newNote, ...notes])
    setSelectedNote(newNote)
    setIsEditing(true)
  }

  const updateNote = (id, updates) => {
    setNotes(notes.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    ))
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, ...updates })
    }
  }

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id))
    if (selectedNote?.id === id) setSelectedNote(null)
  }

  const createFolder = () => {
    if (!newFolderName.trim()) return
    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      icon: '📂',
    }
    setFolders([...folders, newFolder])
    setNewFolderName('')
    setShowNewFolderModal(false)
  }

  const filteredNotes = notes.filter(note => {
    const matchesFolder = selectedFolder === 'all' || note.folderId === selectedFolder
    const matchesSearch = !searchQuery || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFolder && matchesSearch
  })

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📝</span> NoteMaster
          </h1>
          <p className="text-xs text-gray-400 mt-1">Clone de Notion • 96€/an économisés</p>
        </div>

        {/* Search */}
        <div className="p-3">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Folders */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider flex justify-between items-center">
            <span>Dossiers</span>
            <button 
              onClick={() => setShowNewFolderModal(true)}
              className="text-gray-400 hover:text-white"
            >
              +
            </button>
          </div>
          
          <button
            onClick={() => setSelectedFolder('all')}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
              selectedFolder === 'all' ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
          >
            <span>📚</span> Toutes les notes
          </button>
          
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                selectedFolder === folder.id ? 'bg-gray-700' : 'hover:bg-gray-800'
              }`}
            >
              <span>{folder.icon}</span> {folder.name}
            </button>
          ))}
        </div>

        {/* New Note Button */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={createNote}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            + Nouvelle Note
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="w-72 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800">
            {filteredNotes.length} note{filteredNotes.length > 1 ? 's' : ''}
          </h2>
        </div>
        
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-4xl mb-2">📭</p>
            <p>Aucune note</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => { setSelectedNote(note); setIsEditing(false) }}
              className={`p-4 border-b cursor-pointer transition-colors ${
                selectedNote?.id === note.id 
                  ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {note.content.replace(/[#*`-]/g, '').substring(0, 100)}...
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(note.updatedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Editor/Preview */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div className="h-14 border-b bg-white flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    isEditing 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {isEditing ? '✏️ Édition' : '👁️ Lecture'}
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-3 py-1.5 rounded text-sm bg-gray-100 text-gray-700"
                >
                  {showPreview ? 'Cacher aperçu' : 'Montrer aperçu'}
                </button>
              </div>
              <button
                onClick={() => deleteNote(selectedNote.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                🗑️ Supprimer
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {isEditing && (
                <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col border-r`}>
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                    className="p-4 text-2xl font-bold border-b focus:outline-none"
                    placeholder="Titre de la note"
                  />
                  <textarea
                    value={selectedNote.content}
                    onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
                    className="flex-1 p-4 resize-none focus:outline-none font-mono text-sm"
                    placeholder="Écrivez en markdown..."
                  />
                </div>
              )}
              
              {(showPreview || !isEditing) && (
                <div className={`${isEditing ? 'w-1/2' : 'w-full'} overflow-y-auto bg-gray-50`}>
                  <div className="max-w-3xl mx-auto p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                      {selectedNote.title}
                    </h1>
                    <div 
                      className="prose prose-gray"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedNote.content) }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-6xl mb-4">📝</p>
              <p className="text-xl font-medium">Sélectionnez une note</p>
              <p className="text-sm mt-2">ou créez-en une nouvelle</p>
            </div>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Nouveau dossier</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nom du dossier"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

// MeetBook - Clone de Calendly
// Économie: 144€/an vs Calendly Standard

const { useState, useEffect } = React

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
]

export default function App() {
  const [view, setView] = useState('booking') // 'booking' | 'admin'
  const [profile, setProfile] = useState({
    name: 'Votre Nom',
    title: 'Consultant',
    bio: 'Réservez un créneau pour discuter ensemble.',
    avatar: '👤',
    meetingDuration: 30,
    availableDays: [1, 2, 3, 4, 5], // 1=Lun, 7=Dim
    availableSlots: TIME_SLOTS.slice(0, 12),
  })
  const [bookings, setBookings] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    notes: '',
  })

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('meetbook-data')
    if (saved) {
      const data = JSON.parse(saved)
      setProfile(data.profile || profile)
      setBookings(data.bookings || [])
    }
  }, [])

  // Save data
  useEffect(() => {
    localStorage.setItem('meetbook-data', JSON.stringify({ profile, bookings }))
  }, [profile, bookings])

  // Generate calendar dates
  const generateCalendarDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 21; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const calendarDates = generateCalendarDates()

  const isDateAvailable = (date) => {
    const dayOfWeek = date.getDay()
    // Convert to 1-7 format (Mon=1, Sun=7)
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek
    return profile.availableDays.includes(adjustedDay)
  }

  const getAvailableSlots = (date) => {
    if (!date || !isDateAvailable(date)) return []
    
    const dateStr = date.toISOString().split('T')[0]
    const bookedSlots = bookings
      .filter(b => b.date === dateStr)
      .map(b => b.time)
    
    return profile.availableSlots.filter(slot => !bookedSlots.includes(slot))
  }

  const confirmBooking = () => {
    if (!selectedDate || !selectedSlot || !guestInfo.name || !guestInfo.email) return
    
    const booking = {
      id: Date.now().toString(),
      date: selectedDate.toISOString().split('T')[0],
      time: selectedSlot,
      duration: profile.meetingDuration,
      guest: { ...guestInfo },
      createdAt: new Date().toISOString(),
    }
    
    setBookings([...bookings, booking])
    setShowConfirmation(false)
    setShowSuccess(true)
    setSelectedDate(null)
    setSelectedSlot(null)
    setGuestInfo({ name: '', email: '', notes: '' })
  }

  const cancelBooking = (id) => {
    setBookings(bookings.filter(b => b.id !== id))
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  // Booking View (Public page)
  if (view === 'booking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="font-bold text-gray-800">MeetBook</span>
            </div>
            <button
              onClick={() => setView('admin')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Admin →
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Profile Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                  {profile.avatar}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-blue-200">{profile.title}</p>
                </div>
              </div>
              <p className="mt-4 text-blue-100">{profile.bio}</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                <span>⏱️</span> {profile.meetingDuration} minutes
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Sélectionnez une date
              </h2>

              {/* Calendar */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {calendarDates.map((date, i) => {
                  const isAvailable = isDateAvailable(date)
                  const isSelected = selectedDate?.toDateString() === date.toDateString()
                  const isToday = date.toDateString() === new Date().toDateString()
                  
                  return (
                    <button
                      key={i}
                      onClick={() => isAvailable && setSelectedDate(date)}
                      disabled={!isAvailable}
                      className={`p-3 rounded-lg text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : isAvailable
                            ? 'bg-blue-50 hover:bg-blue-100 text-gray-800'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <div className="text-lg font-medium">{date.getDate()}</div>
                      <div className="text-xs opacity-70">
                        {date.toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-3">
                    Créneaux disponibles le {formatDate(selectedDate)}
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {getAvailableSlots(selectedDate).map(slot => (
                      <button
                        key={slot}
                        onClick={() => {
                          setSelectedSlot(slot)
                          setShowConfirmation(true)
                        }}
                        className="py-3 px-4 border-2 border-blue-200 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-medium transition-colors"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  
                  {getAvailableSlots(selectedDate).length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Aucun créneau disponible ce jour
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Clone de Calendly • 144€/an économisés
          </p>
        </main>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">Confirmer votre réservation</h3>
                <p className="text-gray-500 mt-1">
                  {formatDate(selectedDate)} à {selectedSlot}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Votre nom *
                  </label>
                  <input
                    type="text"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jean Dupont"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="jean@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={guestInfo.notes}
                    onChange={(e) => setGuestInfo({ ...guestInfo, notes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Sujet de la réunion..."
                  />
                </div>
              </div>
              
              <div className="p-4 border-t flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmBooking}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-8 text-center shadow-2xl">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-800">Réservation confirmée !</h3>
              <p className="text-gray-500 mt-2">
                Vous recevrez une confirmation par email.
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Parfait !
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Admin View
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <span className="font-bold text-gray-800">MeetBook Admin</span>
          </div>
          <button
            onClick={() => setView('booking')}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Voir page publique →
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Votre profil</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nom</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Titre</label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Durée (minutes)</label>
                  <select
                    value={profile.meetingDuration}
                    onChange={(e) => setProfile({ ...profile, meetingDuration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Jours disponibles</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day, i) => {
                      const dayNum = i + 1
                      const isActive = profile.availableDays.includes(dayNum)
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            setProfile({
                              ...profile,
                              availableDays: isActive
                                ? profile.availableDays.filter(d => d !== dayNum)
                                : [...profile.availableDays, dayNum].sort()
                            })
                          }}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">
                  Réservations ({bookings.length})
                </h2>
              </div>
              
              {bookings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-5xl mb-3">📭</p>
                  <p>Aucune réservation pour le moment</p>
                </div>
              ) : (
                <div className="divide-y">
                  {bookings
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(booking => (
                      <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                            👤
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{booking.guest.name}</p>
                            <p className="text-sm text-gray-500">{booking.guest.email}</p>
                            <p className="text-sm text-blue-600 mt-1">
                              📅 {formatDate(booking.date)} à {booking.time}
                            </p>
                            {booking.guest.notes && (
                              <p className="text-sm text-gray-400 mt-1">
                                💬 {booking.guest.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

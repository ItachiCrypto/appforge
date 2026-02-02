// MoneyTracker - Clone de Finary
// Économie: 100€/an vs Finary Plus

const { useState, useEffect } = React

const CATEGORIES = [
  { id: 'salary', name: 'Salaire', icon: '💰', color: 'bg-green-500' },
  { id: 'food', name: 'Alimentation', icon: '🍕', color: 'bg-orange-500' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: 'bg-blue-500' },
  { id: 'housing', name: 'Logement', icon: '🏠', color: 'bg-purple-500' },
  { id: 'entertainment', name: 'Loisirs', icon: '🎮', color: 'bg-pink-500' },
  { id: 'health', name: 'Santé', icon: '💊', color: 'bg-red-500' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'bg-yellow-500' },
  { id: 'other', name: 'Autre', icon: '📦', color: 'bg-gray-500' },
]

const ACCOUNT_TYPES = [
  { id: 'checking', name: 'Compte courant', icon: '🏦' },
  { id: 'savings', name: 'Livret épargne', icon: '🐷' },
  { id: 'investment', name: 'Investissement', icon: '📈' },
  { id: 'crypto', name: 'Crypto', icon: '₿' },
]

export default function App() {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: 'other',
    description: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'checking',
    balance: '',
  })

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('moneytracker-data')
    if (saved) {
      const data = JSON.parse(saved)
      setAccounts(data.accounts || [])
      setTransactions(data.transactions || [])
    }
  }, [])

  // Save data
  useEffect(() => {
    localStorage.setItem('moneytracker-data', JSON.stringify({ accounts, transactions }))
  }, [accounts, transactions])

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0)

  const expensesByCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: transactions
      .filter(t => t.type === 'expense' && t.category === cat.id)
      .reduce((sum, t) => sum + t.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.accountId) return
    
    const transaction = {
      id: Date.now().toString(),
      ...newTransaction,
      amount: parseFloat(newTransaction.amount),
      createdAt: new Date().toISOString(),
    }
    
    setTransactions([transaction, ...transactions])
    
    // Update account balance
    setAccounts(accounts.map(acc => {
      if (acc.id === transaction.accountId) {
        return {
          ...acc,
          balance: transaction.type === 'income' 
            ? acc.balance + transaction.amount 
            : acc.balance - transaction.amount
        }
      }
      return acc
    }))
    
    setShowAddTransaction(false)
    setNewTransaction({
      type: 'expense',
      amount: '',
      category: 'other',
      description: '',
      accountId: '',
      date: new Date().toISOString().split('T')[0],
    })
  }

  const addAccount = () => {
    if (!newAccount.name || !newAccount.balance) return
    
    const account = {
      id: Date.now().toString(),
      ...newAccount,
      balance: parseFloat(newAccount.balance),
    }
    
    setAccounts([...accounts, account])
    setShowAddAccount(false)
    setNewAccount({ name: '', type: 'checking', balance: '' })
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  // Chart bar heights (simple visualization)
  const maxExpense = Math.max(...expensesByCategory.map(c => c.total), 1)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💎</span>
            <div>
              <h1 className="text-xl font-bold">MoneyTracker</h1>
              <p className="text-xs text-gray-400">Clone de Finary • 100€/an économisés</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Transaction
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {['dashboard', 'transactions', 'accounts'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab 
                  ? 'text-emerald-400 border-b-2 border-emerald-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'dashboard' ? '📊 Dashboard' : tab === 'transactions' ? '📋 Transactions' : '🏦 Comptes'}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5">
                <p className="text-emerald-100 text-sm">Patrimoine Total</p>
                <p className="text-3xl font-bold mt-1">{formatMoney(totalBalance)}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <p className="text-gray-400 text-sm">Revenus du mois</p>
                <p className="text-2xl font-bold text-green-400 mt-1">+{formatMoney(monthlyIncome)}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <p className="text-gray-400 text-sm">Dépenses du mois</p>
                <p className="text-2xl font-bold text-red-400 mt-1">-{formatMoney(monthlyExpenses)}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <p className="text-gray-400 text-sm">Balance mensuelle</p>
                <p className={`text-2xl font-bold mt-1 ${monthlyIncome - monthlyExpenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatMoney(monthlyIncome - monthlyExpenses)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accounts */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Mes Comptes</h2>
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="text-emerald-400 text-sm hover:underline"
                  >
                    + Ajouter
                  </button>
                </div>
                {accounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-4xl mb-2">🏦</p>
                    <p>Ajoutez votre premier compte</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map(acc => {
                      const accType = ACCOUNT_TYPES.find(t => t.id === acc.type)
                      return (
                        <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{accType?.icon}</span>
                            <div>
                              <p className="font-medium">{acc.name}</p>
                              <p className="text-xs text-gray-400">{accType?.name}</p>
                            </div>
                          </div>
                          <p className={`font-bold ${acc.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatMoney(acc.balance)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Expenses by Category */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h2 className="text-lg font-semibold mb-4">Dépenses par catégorie</h2>
                {expensesByCategory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-4xl mb-2">📊</p>
                    <p>Aucune dépense enregistrée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expensesByCategory.slice(0, 5).map(cat => (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{cat.icon} {cat.name}</span>
                          <span className="font-medium">{formatMoney(cat.total)}</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${cat.color} transition-all duration-500`}
                            style={{ width: `${(cat.total / maxExpense) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Dernières transactions</h2>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-2">💸</p>
                  <p>Aucune transaction</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map(t => {
                    const cat = CATEGORIES.find(c => c.id === t.category)
                    return (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{cat?.icon}</span>
                          <div>
                            <p className="font-medium">{t.description || cat?.name}</p>
                            <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        <p className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Toutes les transactions</h2>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-5xl mb-3">💸</p>
                <p className="text-lg">Aucune transaction</p>
                <button
                  onClick={() => setShowAddTransaction(true)}
                  className="mt-4 text-emerald-400 hover:underline"
                >
                  Ajouter une transaction
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {transactions.map(t => {
                  const cat = CATEGORIES.find(c => c.id === t.category)
                  const acc = accounts.find(a => a.id === t.accountId)
                  return (
                    <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-700/30">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${cat?.color} rounded-full flex items-center justify-center text-lg`}>
                          {cat?.icon}
                        </div>
                        <div>
                          <p className="font-medium">{t.description || cat?.name}</p>
                          <p className="text-xs text-gray-400">
                            {acc?.name} • {new Date(t.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Mes Comptes</h2>
              <button
                onClick={() => setShowAddAccount(true)}
                className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-medium"
              >
                + Nouveau compte
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(acc => {
                const accType = ACCOUNT_TYPES.find(t => t.id === acc.type)
                return (
                  <div key={acc.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{accType?.icon}</span>
                      <div>
                        <p className="font-semibold">{acc.name}</p>
                        <p className="text-xs text-gray-400">{accType?.name}</p>
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${acc.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatMoney(acc.balance)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nouvelle transaction</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    newTransaction.type === 'expense' ? 'bg-red-500' : 'bg-gray-700'
                  }`}
                >
                  Dépense
                </button>
                <button
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    newTransaction.type === 'income' ? 'bg-green-500' : 'bg-gray-700'
                  }`}
                >
                  Revenu
                </button>
              </div>
              
              <input
                type="number"
                placeholder="Montant (€)"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              
              <select
                value={newTransaction.accountId}
                onChange={(e) => setNewTransaction({ ...newTransaction, accountId: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Sélectionner un compte</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              
              <select
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              
              <input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddTransaction(false)}
                className="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={addTransaction}
                className="flex-1 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 font-medium"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nouveau compte</h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom du compte"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              
              <select
                value={newAccount.type}
                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ACCOUNT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Solde initial (€)"
                value={newAccount.balance}
                onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddAccount(false)}
                className="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={addAccount}
                className="flex-1 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 font-medium"
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

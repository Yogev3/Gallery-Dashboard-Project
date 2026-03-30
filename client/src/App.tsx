import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 24px' }}>
      <header
        style={{
          background: '#1D3557',
          color: 'white',
          padding: '20px 24px',
          marginBottom: 24,
          borderRadius: '0 0 8px 8px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '2rem' }}>דשבורד ניהול אירועים</h1>
        <small>מצב דמו — נתונים מדומים בלבד</small>
      </header>
      <Dashboard />
    </div>
  )
}

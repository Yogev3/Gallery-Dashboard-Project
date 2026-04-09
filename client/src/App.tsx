import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 24px' }}>
      <header className="app-header">
        <div className="header-content">
          <div>
            <div className="header-title">דשבורד ניהול אירועים</div>
            <div className="header-subtitle">Gallery Event Monitor // Demo Mode</div>
          </div>
          <div className="header-status">
            <span className="status-dot" />
            SYSTEM ACTIVE
          </div>
        </div>
      </header>
      <Dashboard />
    </div>
  )
}

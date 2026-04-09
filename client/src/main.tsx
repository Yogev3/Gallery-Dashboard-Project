import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const requiredEnvVars = ['VITE_API_BASE'] as const

const missing = requiredEnvVars.filter(
  (key) => !import.meta.env[key],
)

if (missing.length > 0) {
  const msg = `Missing required environment variables: ${missing.join(', ')}\nProvide a .env file in the client root.`
  document.getElementById('root')!.innerHTML = `<pre style="color:red;padding:2rem;font-size:1.2rem">${msg}</pre>`
  throw new Error(msg)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

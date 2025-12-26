import { useEffect, useState } from 'react'

import './App.css'
import DashboardPage from './pages/DashboardPage'
import ModulesPage from './pages/ModulesPage'

type Route = 'dashboard' | 'modules'

function parseHashRoute(): Route {
  const h = window.location.hash.replace('#', '')
  if (h === 'modules') return 'modules'
  return 'dashboard'
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHashRoute())

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHashRoute())
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function navigate(next: Route) {
    window.location.hash = next
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>SynapseSync</h1>
          <div style={{ opacity: 0.8, fontSize: 13 }}>V1 — local-first, modulaire</div>
        </div>

        <nav style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('dashboard')} disabled={route === 'dashboard'}>
            Dashboard
          </button>
          <button onClick={() => navigate('modules')} disabled={route === 'modules'}>
            Modules
          </button>
        </nav>
      </header>

      {route === 'dashboard' ? <DashboardPage moduleFilter="github" /> : <ModulesPage />}
    </div>
  )
}

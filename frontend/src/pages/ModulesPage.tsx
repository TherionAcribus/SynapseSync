import { useEffect, useState } from 'react'

import { listModules, syncModule, type ModuleInfo } from '../api/synapsesync'

type ModuleState = {
  module: ModuleInfo
  syncing: boolean
  error: string | null
}

export default function ModulesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modules, setModules] = useState<ModuleState[]>([])

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await listModules()
      setModules(
        res.map((m: ModuleInfo) => ({
          module: m,
          syncing: false,
          error: null,
        })),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function onSync(moduleId: string) {
    setModules((prev) => prev.map((m) => (m.module.id === moduleId ? { ...m, syncing: true, error: null } : m)))
    try {
      await syncModule(moduleId)
      await refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      setModules((prev) => prev.map((m) => (m.module.id === moduleId ? { ...m, syncing: false, error: msg } : m)))
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Modules</h2>
          <div style={{ opacity: 0.8, fontSize: 13 }}>Gestion V1 : détection + sync manuel</div>
        </div>
        <button onClick={() => void refresh()} disabled={loading}>
          Rafraîchir
        </button>
      </header>

      {error ? (
        <div style={{ border: '1px solid #b91c1c', borderRadius: 8, padding: 12, color: '#b91c1c' }}>{error}</div>
      ) : null}

      {modules.length === 0 ? (
        <div style={{ opacity: 0.8 }}>Aucun module détecté.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modules.map((m) => (
            <section key={m.module.id} style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.module.id}</div>
                  <div style={{ opacity: 0.8, fontSize: 13 }}>{m.module.widgets.length} widget(s)</div>
                </div>
                <button onClick={() => void onSync(m.module.id)} disabled={m.syncing || loading}>
                  {m.syncing ? 'Sync…' : 'Sync'}
                </button>
              </div>

              {m.error ? (
                <div style={{ marginTop: 10, color: '#b91c1c' }}>Erreur: {m.error}</div>
              ) : null}

              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {m.module.widgets.map((w: ModuleInfo['widgets'][number]) => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14 }}>{w.title}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        <code>{w.visual_type}</code> — <code>{w.id}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

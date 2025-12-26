import { useEffect, useState } from 'react'

import {
  getModuleConfig,
  listModules,
  saveModuleConfig,
  syncModule,
  testModuleConfig,
  type ModuleInfo,
} from '../api/synapsesync'

type ModuleState = {
  module: ModuleInfo
  syncing: boolean
  error: string | null
}

export default function ModulesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modules, setModules] = useState<ModuleState[]>([])

  const [githubLoading, setGithubLoading] = useState(false)
  const [githubSaving, setGithubSaving] = useState(false)
  const [githubTesting, setGithubTesting] = useState(false)
  const [githubProvider, setGithubProvider] = useState<'api' | 'hpi'>('api')
  const [githubUsername, setGithubUsername] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [githubMsg, setGithubMsg] = useState<string | null>(null)
  const [githubErr, setGithubErr] = useState<string | null>(null)

  async function loadGithubConfig() {
    setGithubLoading(true)
    setGithubErr(null)
    setGithubMsg(null)
    try {
      const res = await getModuleConfig('github')
      const cfg = res.config_json ?? {}
      setGithubProvider(cfg.provider === 'hpi' ? 'hpi' : 'api')
      setGithubUsername(typeof cfg.username === 'string' ? cfg.username : '')
      setGithubToken(typeof cfg.token === 'string' ? cfg.token : '')
    } catch (e) {
      setGithubErr(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setGithubLoading(false)
    }
  }

  async function onSaveGithub() {
    setGithubSaving(true)
    setGithubErr(null)
    setGithubMsg(null)
    try {
      await saveModuleConfig('github', {
        provider: githubProvider,
        username: githubUsername,
        token: githubToken,
      })
      setGithubMsg('Configuration sauvegardée')
    } catch (e) {
      setGithubErr(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setGithubSaving(false)
    }
  }

  async function onTestGithub() {
    setGithubTesting(true)
    setGithubErr(null)
    setGithubMsg(null)
    try {
      await testModuleConfig('github', {
        provider: githubProvider,
        username: githubUsername,
        token: githubToken,
      })
      setGithubMsg('Test OK')
    } catch (e) {
      setGithubErr(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setGithubTesting(false)
    }
  }

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
    void loadGithubConfig()
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

              {m.module.id === 'github' ? (
                <div style={{ marginTop: 12, borderTop: '1px solid #333', paddingTop: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Configuration (V1)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 13, opacity: 0.85 }}>Source</span>
                      <select
                        value={githubProvider}
                        onChange={(e) => setGithubProvider(e.target.value === 'hpi' ? 'hpi' : 'api')}
                        disabled={githubLoading || githubSaving || githubTesting}
                      >
                        <option value="api">API GitHub (direct)</option>
                        <option value="hpi">HPI (exporter)</option>
                      </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 13, opacity: 0.85 }}>GitHub username</span>
                      <input
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="ex: octocat"
                        disabled={githubProvider === 'hpi' || githubLoading || githubSaving || githubTesting}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 13, opacity: 0.85 }}>Token (optionnel)</span>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_..."
                        disabled={githubProvider === 'hpi' || githubLoading || githubSaving || githubTesting}
                      />
                      <span style={{ fontSize: 12, opacity: 0.7 }}>
                        {githubProvider === 'hpi'
                          ? 'En mode HPI, les identifiants sont gérés par la configuration HPI.'
                          : 'Si vide, l’API publique est utilisée (peut être rate-limited).'}
                      </span>
                    </label>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => void loadGithubConfig()} disabled={githubLoading || githubSaving || githubTesting}>
                        {githubLoading ? 'Chargement…' : 'Recharger'}
                      </button>
                      <button onClick={() => void onTestGithub()} disabled={githubLoading || githubSaving || githubTesting}>
                        {githubTesting ? 'Test…' : 'Tester'}
                      </button>
                      <button onClick={() => void onSaveGithub()} disabled={githubLoading || githubSaving || githubTesting}>
                        {githubSaving ? 'Sauvegarde…' : 'Sauver'}
                      </button>
                    </div>

                    {githubErr ? <div style={{ color: '#b91c1c' }}>Erreur: {githubErr}</div> : null}
                    {githubMsg ? <div style={{ color: '#16a34a' }}>{githubMsg}</div> : null}
                  </div>
                </div>
              ) : null}

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

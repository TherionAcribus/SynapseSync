import { useEffect, useMemo, useState, type ComponentType } from 'react'

import { ReactGridLayout as ReactGridLayoutBase, type Layout, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import {
  getDashboard,
  getWidgetData,
  listWidgets,
  saveDashboard,
  syncModule,
  type DashboardConfig,
  type DashboardLayoutItem,
  type DashboardWidgetRef,
  type WidgetDescriptor,
} from '../api/synapsesync'
import { widgetRegistry } from '../widgets/registry'

const ReactGridLayout = ReactGridLayoutBase as unknown as ComponentType<any>

type WidgetState = {
  descriptor: WidgetDescriptor
  loading: boolean
  error: string | null
  data: unknown
}

type Props = {
  moduleFilter?: string
}

export default function DashboardPage(props: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<WidgetState[]>([])
  const [dashboard, setDashboard] = useState<DashboardConfig>({ widgets: [], layout: [] })
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const cw = (useContainerWidth as unknown as (opts: unknown) => any)({
    measureBeforeMount: false,
    initialWidth: 1200,
  })
  const gridWidth: number = typeof cw?.width === 'number' ? cw.width : 1200
  const containerRef = cw?.containerRef

  const COLS = 12
  const ROW_HEIGHT = 20
  const MIN_W = 2
  const MIN_H = 1
  const DEFAULT_W = 6
  const DEFAULT_H = 4

  function widgetKey(ref: { module_id: string; widget_id: string }) {
    return `${ref.module_id}:${ref.widget_id}`
  }

  function withConstraints(item: DashboardLayoutItem): DashboardLayoutItem {
    return {
      ...item,
      minW: MIN_W,
      minH: MIN_H,
    }
  }

  function defaultLayoutItem(i: string, index: number): DashboardLayoutItem {
    const w = DEFAULT_W
    const h = DEFAULT_H
    const x = (index % 2) * w
    const y = Math.floor(index / 2) * h
    return withConstraints({ i, x, y, w, h })
  }

  function isFiniteNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v)
  }

  function isValidLayoutItem(item: DashboardLayoutItem): boolean {
    return (
      typeof item.i === 'string' &&
      isFiniteNumber(item.x) &&
      isFiniteNumber(item.y) &&
      isFiniteNumber(item.w) &&
      isFiniteNumber(item.h) &&
      item.w > 0 &&
      item.h > 0
    )
  }

  function normalizeLayout(
    layout: DashboardLayoutItem[] | undefined,
    widgetRefs: DashboardWidgetRef[],
  ): DashboardLayoutItem[] {
    const keys = widgetRefs.map((w) => widgetKey(w))
    const map = new Map<string, DashboardLayoutItem>()
    for (const item of Array.isArray(layout) ? layout : []) {
      if (item && typeof item.i === 'string' && isValidLayoutItem(item)) {
        map.set(item.i, withConstraints(item))
      }
    }
    return keys.map((k, idx) => map.get(k) ?? defaultLayoutItem(k, idx))
  }

  const filteredWidgets = useMemo(() => {
    if (!props.moduleFilter) return widgets
    return widgets.filter((w) => w.descriptor.module_id === props.moduleFilter)
  }, [props.moduleFilter, widgets])

  const selectedKeySet = useMemo(() => {
    return new Set(dashboard.widgets.map((w) => widgetKey(w)))
  }, [dashboard.widgets])

  const selectedWidgets = useMemo(() => {
    return filteredWidgets.filter((w) => selectedKeySet.has(`${w.descriptor.module_id}:${w.descriptor.id}`))
  }, [filteredWidgets, selectedKeySet])

  const gridLayout = useMemo(() => {
    const selectedKeys = selectedWidgets.map((w) => `${w.descriptor.module_id}:${w.descriptor.id}`)
    const cfgLayout = Array.isArray(dashboard.layout) ? dashboard.layout : []
    const map = new Map(cfgLayout.map((l) => [l.i, l] as const))
    return selectedKeys.map((k, idx) => (map.get(k) ? withConstraints(map.get(k)!) : defaultLayoutItem(k, idx)))
  }, [dashboard.layout, selectedWidgets])

  const availableToAdd = useMemo(() => {
    return filteredWidgets.filter((w) => !selectedKeySet.has(`${w.descriptor.module_id}:${w.descriptor.id}`))
  }, [filteredWidgets, selectedKeySet])

  async function refreshWidgets() {
    setLoading(true)
    setError(null)
    try {
      const descriptors = await listWidgets()
      const initial: WidgetState[] = descriptors.map((d) => ({
        descriptor: d,
        loading: true,
        error: null,
        data: null,
      }))
      setWidgets(initial)

      await Promise.all(
        initial.map(async (w) => {
          try {
            const res = await getWidgetData(w.descriptor.module_id, w.descriptor.id)
            setWidgets((prev) =>
              prev.map((p) =>
                p.descriptor.module_id === w.descriptor.module_id && p.descriptor.id === w.descriptor.id
                  ? { ...p, loading: false, data: res.data }
                  : p,
              ),
            )
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Erreur'
            setWidgets((prev) =>
              prev.map((p) =>
                p.descriptor.module_id === w.descriptor.module_id && p.descriptor.id === w.descriptor.id
                  ? { ...p, loading: false, error: msg }
                  : p,
              ),
            )
          }
        }),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function loadDashboard() {
    setDashboardLoading(true)
    setError(null)
    try {
      const res = await getDashboard('default')
      const cfg = res.config_json ?? { widgets: [] }
      const rawWidgets: Array<Record<string, unknown>> = Array.isArray(cfg.widgets) ? cfg.widgets : []
      const widgetRefs: DashboardWidgetRef[] = rawWidgets
        .map((w) => ({
          module_id: String(w.module_id ?? ''),
          widget_id: String(w.widget_id ?? ''),
        }))
        .filter((w) => Boolean(w.module_id) && Boolean(w.widget_id))

      const legacyLayout: DashboardLayoutItem[] = rawWidgets
        .map((w, idx) => {
          const moduleId = w.module_id
          const widgetId = w.widget_id
          if (typeof moduleId !== 'string' || typeof widgetId !== 'string') return null

          const x = w.x
          const y = w.y
          const ww = w.w
          const h = w.h
          if (typeof x !== 'number' || typeof y !== 'number' || typeof ww !== 'number' || typeof h !== 'number') return null

          return {
            ...defaultLayoutItem(widgetKey({ module_id: moduleId, widget_id: widgetId }), idx),
            x,
            y,
            w: ww,
            h,
          }
        })
        .filter((x): x is DashboardLayoutItem => x !== null)

      const rawCfgLayout: DashboardLayoutItem[] = Array.isArray(cfg.layout) ? (cfg.layout as DashboardLayoutItem[]) : []
      const cfgLayoutHasInvalid = rawCfgLayout.some((it) => !isValidLayoutItem(it))
      const seedLayout = rawCfgLayout.length > 0 && !cfgLayoutHasInvalid ? rawCfgLayout : legacyLayout

      const layout = normalizeLayout(seedLayout, widgetRefs)
      setDashboard({ widgets: widgetRefs, layout })

      const hasLegacyWidgetLayout = rawWidgets.some((w) => 'x' in w || 'y' in w || 'w' in w || 'h' in w)
      const hasLayout = rawCfgLayout.length > 0
      if ((!hasLayout && (hasLegacyWidgetLayout || legacyLayout.length > 0)) || (hasLayout && cfgLayoutHasInvalid)) {
        void persistDashboard({ widgets: widgetRefs, layout })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setDashboardLoading(false)
    }
  }

  async function persistDashboard(next: DashboardConfig) {
    setSaving(true)
    setError(null)
    try {
      await saveDashboard('default', next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  function addWidget(ref: DashboardWidgetRef) {
    const key = widgetKey(ref)
    if (selectedKeySet.has(key)) return
    const nextWidgets = [...dashboard.widgets, ref]
    const nextLayout = normalizeLayout(dashboard.layout, nextWidgets)
    const next = { widgets: nextWidgets, layout: nextLayout }
    setDashboard(next)
    void persistDashboard(next)
  }

  function removeWidget(ref: DashboardWidgetRef) {
    const key = widgetKey(ref)
    const next = {
      widgets: dashboard.widgets.filter((w) => !(w.module_id === ref.module_id && w.widget_id === ref.widget_id)),
      layout: (dashboard.layout ?? []).filter((l) => l.i !== key),
    }
    setDashboard(next)
    void persistDashboard(next)
  }

  function updateLayout(nextLayout: Layout) {
    const existing = new Map((dashboard.layout ?? []).map((l) => [l.i, l] as const))
    const next = {
      widgets: dashboard.widgets,
      layout: nextLayout.map((l, idx) => {
        const prev = existing.get(l.i)
        const fallback = prev ?? defaultLayoutItem(l.i, idx)

        const x = isFiniteNumber(l.x) ? l.x : fallback.x
        const y = isFiniteNumber(l.y) ? l.y : fallback.y
        const w = isFiniteNumber(l.w) ? l.w : fallback.w
        const h = isFiniteNumber(l.h) ? l.h : fallback.h

        const safeW = Math.max(1, Math.min(COLS, w))
        const maxX = Math.max(0, COLS - safeW)

        return {
          i: l.i,
          x: Math.max(0, Math.min(maxX, x)),
          y: Math.max(0, y),
          w: safeW,
          h: Math.max(1, h),
          minW: MIN_W,
          minH: MIN_H,
          maxW: l.maxW,
          maxH: l.maxH,
          static: l.static,
        }
      }),
    }
    setDashboard(next)
    void persistDashboard(next)
  }

  async function syncFilteredModule() {
    if (!props.moduleFilter) return

    setLoading(true)
    setError(null)
    try {
      await syncModule(props.moduleFilter)
      await refreshWidgets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshWidgets()
    void loadDashboard()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div style={{ opacity: 0.8, fontSize: 13 }}>Widgets (V1) — dashboard: default</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => void refreshWidgets()} disabled={loading}>
            Rafraîchir
          </button>
          {props.moduleFilter ? (
            <button onClick={() => void syncFilteredModule()} disabled={loading}>
              Sync {props.moduleFilter}
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div style={{ border: '1px solid #b91c1c', borderRadius: 8, padding: 12, color: '#b91c1c' }}>{error}</div>
      ) : null}

      <section style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontWeight: 700 }}>Configuration</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {dashboardLoading ? 'Chargement…' : saving ? 'Sauvegarde…' : 'OK'}
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Widgets sur le dashboard</div>
          {dashboard.widgets.length === 0 ? (
            <div style={{ opacity: 0.8 }}>Aucun widget sélectionné.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dashboard.widgets.map((w) => (
                <div key={`${w.module_id}:${w.widget_id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <code>{w.module_id}</code> / <code>{w.widget_id}</code>
                  </div>
                  <button onClick={() => removeWidget(w)} disabled={saving}>
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>Ajouter un widget</div>
          {availableToAdd.length === 0 ? (
            <div style={{ opacity: 0.8 }}>Aucun widget disponible à ajouter.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {availableToAdd.map((w) => (
                <div
                  key={`add:${w.descriptor.module_id}:${w.descriptor.id}`}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
                >
                  <div>
                    {w.descriptor.title} <span style={{ opacity: 0.7 }}>({w.descriptor.visual_type})</span>
                  </div>
                  <button
                    onClick={() => addWidget({ module_id: w.descriptor.module_id, widget_id: w.descriptor.id })}
                    disabled={saving}
                  >
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <main style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {selectedWidgets.length === 0 ? (
          <div style={{ opacity: 0.8 }}>Aucun widget à afficher (ajoute-en dans la configuration).</div>
        ) : (
          <div ref={containerRef} style={{ width: '100%' }}>
            <ReactGridLayout
              className="layout"
              width={gridWidth}
              cols={COLS}
              rowHeight={ROW_HEIGHT}
              margin={[12, 12]}
              containerPadding={[0, 0]}
              compactType={null}
              preventCollision
              isBounded
              isDraggable={!saving}
              isResizable={!saving}
              resizeHandles={['s', 'e', 'se']}
              layout={gridLayout}
              onDragStop={(nextLayout: Layout) => updateLayout(nextLayout)}
              onResizeStop={(nextLayout: Layout) => updateLayout(nextLayout)}
            >
              {selectedWidgets.map((w) => {
                const key = `${w.descriptor.module_id}:${w.descriptor.id}`
                const Renderer = widgetRegistry[w.descriptor.visual_type]
                return (
                  <div key={key} style={{ border: '1px solid #333', borderRadius: 8, padding: 12, overflow: 'auto' }}>
                    {!Renderer ? (
                      <>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{w.descriptor.title}</div>
                        <div style={{ marginTop: 8, opacity: 0.8 }}>
                          Widget non supporté: <code>{w.descriptor.visual_type}</code>
                        </div>
                      </>
                    ) : w.loading ? (
                      <div style={{ opacity: 0.8 }}>Chargement — {w.descriptor.title}</div>
                    ) : w.error ? (
                      <div style={{ color: '#b91c1c' }}>
                        Erreur — {w.descriptor.title}: {w.error}
                      </div>
                    ) : (
                      <Renderer title={w.descriptor.title} data={w.data} />
                    )}
                  </div>
                )
              })}
            </ReactGridLayout>
          </div>
        )}
      </main>
    </div>
  )
}

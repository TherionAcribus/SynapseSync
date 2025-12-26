import { apiFetch } from './client'

export type WidgetDescriptor = {
  module_id: string
  id: string
  title: string
  visual_type: string
  description?: string | null
  config_schema?: Record<string, unknown>
}

export type WidgetData = {
  visual_type: string
  data: unknown
}

export type ModuleInfo = {
  id: string
  widgets: Omit<WidgetDescriptor, 'module_id'>[]
}

export type ModuleConfig = {
  module_id: string
  config_json: Record<string, unknown>
}

export type DashboardWidgetRef = {
  module_id: string
  widget_id: string
}

export type DashboardLayoutItem = {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
}

export type DashboardConfig = {
  widgets: DashboardWidgetRef[]
  layout?: DashboardLayoutItem[]
}

export type Dashboard = {
  id: string
  config_json: DashboardConfig
  updated_at?: string
}

export async function listWidgets(): Promise<WidgetDescriptor[]> {
  return apiFetch<WidgetDescriptor[]>('/api/widgets')
}

export async function listModules(): Promise<ModuleInfo[]> {
  return apiFetch<ModuleInfo[]>('/api/modules')
}

export async function getWidgetData(moduleId: string, widgetId: string): Promise<WidgetData> {
  return apiFetch<WidgetData>(`/api/widget-data/${encodeURIComponent(moduleId)}/${encodeURIComponent(widgetId)}`)
}

export async function getDashboard(dashboardId: string): Promise<Dashboard> {
  return apiFetch<Dashboard>(`/api/dashboards/${encodeURIComponent(dashboardId)}`)
}

export async function saveDashboard(dashboardId: string, config: DashboardConfig): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/api/dashboards/${encodeURIComponent(dashboardId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ config_json: config }),
    },
  )
}

export async function syncModule(moduleId: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/api/modules/${encodeURIComponent(moduleId)}/sync`, {
    method: 'POST',
  })
}

export async function getModuleConfig(moduleId: string): Promise<ModuleConfig> {
  return apiFetch<ModuleConfig>(`/api/modules/${encodeURIComponent(moduleId)}/config`)
}

export async function saveModuleConfig(moduleId: string, configJson: Record<string, unknown>): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/api/modules/${encodeURIComponent(moduleId)}/config`, {
    method: 'POST',
    body: JSON.stringify({ config_json: configJson }),
  })
}

export async function testModuleConfig(moduleId: string, configJson: Record<string, unknown>): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/api/modules/${encodeURIComponent(moduleId)}/test`, {
    method: 'POST',
    body: JSON.stringify({ config_json: configJson }),
  })
}

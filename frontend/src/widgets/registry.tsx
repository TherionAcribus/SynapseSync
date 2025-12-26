import type { ComponentType } from 'react'

import CounterWidget from './CounterWidget.tsx'
import TimelineWidget from './TimelineWidget.tsx'

export type WidgetRendererProps = {
  title: string
  data: unknown
}

export const widgetRegistry: Record<string, ComponentType<WidgetRendererProps>> = {
  counter: CounterWidget,
  timeline: TimelineWidget,
}

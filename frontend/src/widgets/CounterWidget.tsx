import type { WidgetRendererProps } from './registry'

type CounterData = {
  value: number
}

export default function CounterWidget(props: WidgetRendererProps) {
  const data = props.data as CounterData | null | undefined
  const value = typeof data?.value === 'number' ? data.value : null

  return (
    <section style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{props.title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{value ?? '—'}</div>
    </section>
  )
}

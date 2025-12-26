import type { WidgetRendererProps } from './registry'

type TimelineItem = {
  timestamp: string
  summary_text: string
  event_type?: string
}

export default function TimelineWidget(props: WidgetRendererProps) {
  const items = Array.isArray(props.data) ? (props.data as TimelineItem[]) : []

  return (
    <section style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{props.title}</div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Aucun événement.</div>
        ) : (
          items.map((it, idx) => (
            <div key={`${it.timestamp}-${idx}`} style={{ display: 'flex', gap: 10 }}>
              <div style={{ minWidth: 170, fontSize: 12, opacity: 0.8 }}>
                {new Date(it.timestamp).toLocaleString()}
              </div>
              <div style={{ flex: 1 }}>{it.summary_text}</div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

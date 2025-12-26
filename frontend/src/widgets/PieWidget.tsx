import React from 'react'

interface PieData {
  labels: string[]
  values: number[]
}

interface PieWidgetProps {
  title: string
  data: unknown
}

export default function PieWidget({ title, data }: PieWidgetProps) {
  // Cast des données avec vérification
  const pieData = data as PieData
  
  if (!pieData || !pieData.labels || !pieData.values || pieData.labels.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    )
  }

  // Calcul des pourcentages pour le cercle
  const total = pieData.values.reduce((sum, val) => sum + val, 0)
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ]

  let currentAngle = 0
  const segments = pieData.labels.map((label, index) => {
    const value = pieData.values[index]
    const percentage = (value / total) * 100
    const angle = (value / total) * 360
    
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    // Création du path SVG pour le segment
    const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180)
    const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180)
    const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180)
    const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180)
    
    const largeArcFlag = angle > 180 ? 1 : 0
    
    const pathData = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')
    
    currentAngle += angle
    
    return {
      label,
      value,
      percentage,
      color: colors[index % colors.length],
      pathData
    }
  })

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="flex items-center space-x-6">
        {/* Graphique en cercle */}
        <div className="flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 100 100">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.pathData}
                fill={segment.color}
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>
        
        {/* Légende */}
        <div className="flex-1">
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm text-gray-700">{segment.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {segment.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

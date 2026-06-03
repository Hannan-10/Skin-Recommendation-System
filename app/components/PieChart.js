import React from 'react'
import { View } from 'react-native'
import StackedBar from './StackedBar'

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function wedgePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

export default function PieChart({ data, size = 120, radius, fallbackBar = false }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = radius ?? size / 2
  let Svg, Path
  try {
    const svg = require('react-native-svg')
    Svg = svg.Svg
    Path = svg.Path
  } catch (e) {
    Svg = null
  }
  if (!Svg || fallbackBar) {
    return (
      <View style={{ width: size }}>
        <StackedBar data={data} height={14} radius={7} />
      </View>
    )
  }
  let angle = 0
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const sliceAngle = (d.value / total) * 360
        const path = wedgePath(size / 2, size / 2, r, angle, angle + sliceAngle)
        const el = <Path key={i} d={path} fill={d.color} />
        angle += sliceAngle
        return el
      })}
    </Svg>
  )
}

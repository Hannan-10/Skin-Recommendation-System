import React from 'react'
import { View, StyleSheet } from 'react-native'

export default function StackedBar({ data, height = 14, radius = 7 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <View style={[styles.wrap, { height, borderRadius: radius }]}>
      {data.map((d, i) => {
        const w = `${(d.value / total) * 100}%`
        const leftRadius = i === 0 ? radius : 0
        const rightRadius = i === data.length - 1 ? radius : 0
        return (
          <View
            key={i}
            style={{
              width: w,
              backgroundColor: d.color,
              height,
              borderTopLeftRadius: leftRadius,
              borderBottomLeftRadius: leftRadius,
              borderTopRightRadius: rightRadius,
              borderBottomRightRadius: rightRadius,
            }}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', flexDirection: 'row' },
})

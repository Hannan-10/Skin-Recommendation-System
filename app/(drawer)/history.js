import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import ScreenHeader from '../components/ScreenHeader'
import PieChart from '../components/PieChart'
import { useRouter } from 'expo-router'
import StackedBar from '../components/StackedBar'
import { getScanHistory } from '../../firebase/user'

const CONDITION_COLORS = {
  Acne:       '#E75480',
  Wrinkles:   '#FF9DB3',
  Pores:      '#FBC6D5',
  Spots:      '#FADDE5',
  Blackheads: '#FFE8F0',
}

// Map raw API labels to display labels
const LABEL_MAP = {
  acne:        'Acne',
  wrinkles:    'Wrinkles',
  pores:       'Pores',
  'dark spots': 'Spots',
  blackheads:  'Blackheads',
}

function formatDateTime(timestamp) {
  if (!timestamp) return { date: '—', time: '—' }
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  return { date, time }
}

function transformEntry(raw) {
  const { date, time } = formatDateTime(raw.scannedAt)
  const skinType = raw.skinType
    ? raw.skinType.charAt(0).toUpperCase() + raw.skinType.slice(1)
    : 'Unknown'
  const conditions = (raw.conditions || []).map(c => ({
    label: LABEL_MAP[c.label] || (c.label.charAt(0).toUpperCase() + c.label.slice(1)),
    value: `${Math.round((c.confidence || 0) * 100)}%`,
  }))
  return { id: raw.id, date, time, skinType, conditions }
}

export default function History() {
  const router = useRouter()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getScanHistory()
      .then(data => setHistory(data.map(transformEntry)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <ScreenHeader title="History" onBack={() => router.replace('/(drawer)/(tabs)/home')} />

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color="#E75480" size="large" />
        </View>
      )}

      {!loading && history.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No scan history yet.</Text>
          <Text style={styles.emptySubText}>Complete a skin scan to see your results here.</Text>
        </View>
      )}

      {history.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>{entry.date}</Text>
            <Text style={styles.subTitle}>{entry.time}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Skin Type</Text>
            <Text style={styles.value}>{entry.skinType}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.label}>Conditions</Text>
          <View style={styles.conditions}>
            {entry.conditions.map((c) => (
              <View key={c.label} style={styles.badge}>
                <View style={[styles.dot, { backgroundColor: CONDITION_COLORS[c.label] || '#FFE8F0' }]} />
                <Text style={styles.badgeText}>{c.label} {c.value}</Text>
              </View>
            ))}
          </View>
          {entry.conditions.length > 0 && (
            <>
              <View style={{ marginTop: 10 }}>
                <StackedBar
                  data={entry.conditions.map((c) => ({
                    value: parseInt(c.value, 10),
                    color: CONDITION_COLORS[c.label] || '#FFE8F0',
                  }))}
                />
              </View>
              <View style={{ marginTop: 10, alignItems: 'center' }}>
                <PieChart
                  data={entry.conditions.map((c) => ({
                    value: parseInt(c.value, 10),
                    color: CONDITION_COLORS[c.label] || '#FFE8F0',
                  }))}
                  size={100}
                />
              </View>
            </>
          )}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FFF9F6', marginTop: 15 },
  centered:     { marginTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyText:    { fontSize: 16, color: '#330033', fontFamily: 'Nunito-Bold', marginBottom: 8 },
  emptySubText: { fontSize: 13, color: '#888', fontFamily: 'Nunito-Regular', textAlign: 'center' },
  card:         { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:        { fontSize: 16, color: '#330033', fontFamily: 'Nunito-ExtraBold' },
  subTitle:     { fontSize: 13, color: '#888', fontFamily: 'Nunito-Regular' },
  label:        { fontSize: 13, color: '#666', fontFamily: 'Nunito-Regular', marginTop: 8 },
  value:        { fontSize: 14, color: '#333', fontFamily: 'Nunito-Bold' },
  divider:      { height: 1, backgroundColor: '#FDEEF4', marginVertical: 8 },
  conditions:   { marginTop: 6 },
  badge:        { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot:          { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  badgeText:    { fontSize: 12, color: '#333', fontFamily: 'Nunito-SemiBold' },
})

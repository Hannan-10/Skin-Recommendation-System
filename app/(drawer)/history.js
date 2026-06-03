import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import ScreenHeader from '../components/ScreenHeader'
import PieChart from '../components/PieChart'
import { useRouter } from 'expo-router'
import StackedBar from '../components/StackedBar'

const mockHistory = [
  { id: 'h1', date: 'Mar 01, 2026', time: '09:32', skinType: 'Oily', conditions: [{ label: 'Acne', value: '40%' }, { label: 'Pores', value: '20%' }, { label: 'Spots', value: '15%' }, { label: 'Wrinkles', value: '15%' }, { label: 'Blackheads', value: '10%' }] },
  { id: 'h2', date: 'Mar 07, 2026', time: '10:15', skinType: 'Oily', conditions: [{ label: 'Acne', value: '25%' }, { label: 'Pores', value: '20%' }, { label: 'Spots', value: '15%' }, { label: 'Wrinkles', value: '10%' }, { label: 'Blackheads', value: '30%' }] },
  { id: 'h3', date: 'Mar 14, 2026', time: '11:00', skinType: 'Combination', conditions: [{ label: 'Acne', value: '15%' }, { label: 'Pores', value: '10%' }, { label: 'Spots', value: '10%' }, { label: 'Wrinkles', value: '8%' }, { label: 'Blackheads', value: '55%' }] },
]
const CONDITION_COLORS = {
  Acne: '#E75480',
  Wrinkles: '#FF9DB3',
  Pores: '#FBC6D5',
  Spots: '#FADDE5',
  Blackheads: '#FFE8F0',
}
export default function History() {
  const router = useRouter()
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <ScreenHeader title="History" onBack={() => router.replace('/(drawer)/(tabs)/home')} />
      {mockHistory.map((entry) => (
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
                <View
  style={[
    styles.dot,
    { backgroundColor: CONDITION_COLORS[c.label] || '#FFE8F0' },
  ]}
/>
                <Text style={styles.badgeText}>{c.label} {c.value}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 10 }}>
            <StackedBar
              data={entry.conditions.map((c) => {
                const mapping = {
                  Acne: '#E75480',
                  Wrinkles: '#FF9DB3',
                  Pores: '#FBC6D5',
                  Spots: '#FADDE5',
                  Blackheads: '#FFE8F0',
                }
                const color = mapping[c.label] || '#FFE8F0'
                return { value: parseInt(c.value, 10), color }
              })}
            />
          </View>
          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <PieChart
              data={entry.conditions.map((c) => {
                const mapping = {
                  Acne: '#E75480',
                  Wrinkles: '#FF9DB3',
                  Pores: '#FBC6D5',
                  Spots: '#FADDE5',
                  Blackheads: '#FFE8F0',
                }
                return { value: parseInt(c.value, 10), color: mapping[c.label] || '#FFE8F0' }
              })}
              size={100}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F6', marginTop:15 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, color: '#330033', fontFamily: 'Nunito-ExtraBold' },
  subTitle: { fontSize: 13, color: '#888', fontFamily: 'Nunito-Regular' },
  label: { fontSize: 13, color: '#666', fontFamily: 'Nunito-Regular', marginTop: 8 },
  value: { fontSize: 14, color: '#333', fontFamily: 'Nunito-Bold' },
  divider: { height: 1, backgroundColor: '#FDEEF4', marginVertical: 8 },
  conditions: { marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  badgeText: { fontSize: 12, color: '#333', fontFamily: 'Nunito-SemiBold' },
})

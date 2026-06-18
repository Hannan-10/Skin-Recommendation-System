import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, useRouter } from 'expo-router'
import { getActiveRoutine, clearActiveRoutine } from '../../firebase/user'
import PieChart from '../components/PieChart'

const CONDITION_COLORS = {
  acne:       '#E75480',
  wrinkles:   '#FF9DB3',
  pores:      '#FBC6D5',
  'dark spots': '#FADDE5',
  blackheads: '#A78BFA',
}

const ALL_CONDITIONS = ['acne', 'wrinkles', 'pores', 'dark spots', 'blackheads']

function pct(val) { return Math.round((val || 0) * 100) }

function buildPieData(conditions) {
  return ALL_CONDITIONS.map(label => {
    const match = (conditions || []).find(c => c.label === label)
    return {
      value: match ? pct(match.confidence) : 0,
      color: CONDITION_COLORS[label] || '#ccc',
      label,
    }
  }).filter(d => d.value > 0)
}

function daysSince(ts) {
  if (!ts?.seconds) return 0
  return Math.floor((Date.now() - ts.seconds * 1000) / 86400000)
}

export default function Progress() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [routine, setRoutine] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await getActiveRoutine().catch(() => null)
        setRoutine(r)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const goHome = () => router.replace('/(drawer)/(tabs)/home')

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#E75480" />
        </View>
      </SafeAreaView>
    )
  }

  // ── No active routine ────────────────────────────────────────────────────
  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backBtn} onPress={goHome}>
            <Ionicons name="arrow-back" size={22} color="#2D2D2D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Skin Journey</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={56} color="#ddd" />
          <Text style={styles.emptyTitle}>No Active Routine</Text>
          <Text style={styles.emptySub}>
            Go to Recommendations, pick a product and tap "Start Routine" to begin tracking your skin progress.
          </Text>
          <TouchableOpacity style={styles.goRecsBtn} onPress={() => router.replace('/(drawer)/(tabs)/recs')}>
            <Text style={styles.goRecsBtnText}>View Recommendations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const baseScan    = routine.baseScan
  const currentScan = routine.latestProgressScan || null
  const hasComparison = !!(baseScan && currentScan)

  // Compute per-condition improvement
  const improvements = ALL_CONDITIONS.map(label => {
    const base    = baseScan?.conditions?.find(c => c.label === label)
    const current = currentScan?.conditions?.find(c => c.label === label)
    if (!base && !current) return null
    const basePct    = pct(base?.confidence    || 0)
    const currentPct = pct(current?.confidence || 0)
    const delta = basePct - currentPct // positive = improved
    return { label, basePct, currentPct, delta }
  }).filter(Boolean)

  const improvedCount = improvements.filter(i => i.delta > 0).length
  const overallDelta  = improvements.length
    ? Math.round(improvements.reduce((s, i) => s + i.delta, 0) / improvements.length)
    : 0
  const noImprovement = routine.noImprovementCount >= 2

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Top nav ── */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={goHome}>
          <Ionicons name="arrow-back" size={22} color="#2D2D2D" />
        </TouchableOpacity>
        <View>
          <Text style={styles.welcomeText}>Progress Report</Text>
          <Text style={styles.headerTitle}>My Skin Journey</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Active routine banner ── */}
        <LinearGradient colors={['#E75480', '#FF6B9D']} style={styles.routineBanner}>
          <View style={styles.routineBannerLeft}>
            <Text style={styles.routineBannerLabel}>ACTIVE ROUTINE</Text>
            <Text style={styles.routineBannerProduct} numberOfLines={1}>
              {routine.product?.name || 'Your Product'}
            </Text>
            <Text style={styles.routineBannerMeta}>
              {routine.product?.brand}
              {routine.routineTimes?.length
                ? '  ·  ' + routine.routineTimes.map(t => {
                    const [h, m] = t.split(':').map(Number)
                    return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
                  }).join(' & ')
                : ''}
            </Text>
          </View>
          <View style={styles.daysCircle}>
            <Text style={styles.daysNum}>{daysSince(routine.startedAt)}</Text>
            <Text style={styles.daysLabel}>days</Text>
          </View>
        </LinearGradient>

        {/* ── Scan button (always visible) ── */}
        <TouchableOpacity
          style={styles.scanProgressBtn}
          onPress={() => router.push('/skinresult?routineCheck=true')}
        >
          <Ionicons name="scan-outline" size={18} color="#E75480" />
          <Text style={styles.scanProgressBtnText}>Scan Skin to Check Progress</Text>
          <Ionicons name="chevron-forward" size={16} color="#E75480" />
        </TouchableOpacity>

        {/* ── No improvement warning ── */}
        {noImprovement && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={20} color="#E67E22" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>No visible improvement detected</Text>
              <Text style={styles.warningSub}>
                Consider trying product #{(routine.productIndex || 0) + 2} from your recommendations.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={async () => {
                await clearActiveRoutine().catch(() => {})
                router.replace('/(drawer)/(tabs)/recs')
              }}
            >
              <Text style={styles.switchBtnText}>Switch</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Comparison ── */}
        {hasComparison ? (
          <>
            {/* Overall score */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreCardLeft}>
                <Text style={styles.scoreLabel}>Overall Skin Improvement</Text>
                <Text style={[
                  styles.scoreValue,
                  { color: overallDelta > 0 ? '#00C896' : overallDelta < 0 ? '#E75480' : '#888' }
                ]}>
                  {overallDelta > 0 ? '+' : ''}{overallDelta}%
                </Text>
                <Text style={styles.scoreSub}>
                  {improvedCount}/{improvements.length} conditions improved
                </Text>
              </View>
              <Ionicons
                name={overallDelta > 0 ? 'trending-up' : overallDelta < 0 ? 'trending-down' : 'remove-outline'}
                size={40}
                color={overallDelta > 0 ? '#00C896' : overallDelta < 0 ? '#E75480' : '#aaa'}
              />
            </View>

            {/* Before / After pie charts */}
            <View style={styles.piesBlock}>
              <Text style={styles.blockTitle}>Skin Condition Comparison</Text>
              <View style={styles.piesRow}>
                <View style={styles.pieCard}>
                  <PieChart data={buildPieData(baseScan.conditions)} size={120} />
                  <Text style={styles.pieLabel}>Before</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#E75480" style={{ alignSelf: 'center' }} />
                <View style={styles.pieCard}>
                  <PieChart data={buildPieData(currentScan.conditions)} size={120} />
                  <Text style={styles.pieLabel}>After</Text>
                </View>
              </View>
            </View>

            {/* Per-condition breakdown */}
            <View style={styles.breakdownBlock}>
              <Text style={styles.blockTitle}>Condition Breakdown</Text>
              {improvements.map(item => (
                <View key={item.label} style={styles.condRow}>
                  <View style={[styles.condDot, { backgroundColor: CONDITION_COLORS[item.label] || '#ccc' }]} />
                  <Text style={styles.condLabel}>
                    {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                  </Text>
                  <View style={styles.condBarBg}>
                    <View style={[styles.condBar, {
                      width: `${item.basePct}%`,
                      backgroundColor: CONDITION_COLORS[item.label] || '#ccc',
                      opacity: 0.4,
                    }]} />
                    <View style={[styles.condBar, styles.condBarForeground, {
                      width: `${item.currentPct}%`,
                      backgroundColor: CONDITION_COLORS[item.label] || '#ccc',
                    }]} />
                  </View>
                  <Text style={[
                    styles.condDelta,
                    { color: item.delta > 0 ? '#00C896' : item.delta < 0 ? '#E75480' : '#aaa' }
                  ]}>
                    {item.delta > 0 ? '↓' : item.delta < 0 ? '↑' : '–'}{Math.abs(item.delta)}%
                  </Text>
                </View>
              ))}
              <View style={styles.condLegend}>
                <View style={styles.condLegendItem}>
                  <View style={[styles.condLegendSwatch, { opacity: 0.4, backgroundColor: '#E75480' }]} />
                  <Text style={styles.condLegendText}>Before</Text>
                </View>
                <View style={styles.condLegendItem}>
                  <View style={[styles.condLegendSwatch, { backgroundColor: '#E75480' }]} />
                  <Text style={styles.condLegendText}>After</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noDataCard}>
            <Ionicons name="scan-outline" size={40} color="#ddd" />
            {baseScan ? (
              <>
                <Text style={styles.noDataTitle}>Baseline Set!</Text>
                <Text style={styles.noDataSub}>
                  Use your product for a few days, then scan again to see how your skin has improved.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.noDataTitle}>Scan to Start Tracking</Text>
                <Text style={styles.noDataSub}>
                  Scan your skin now to set your baseline. After using your product, scan again to see the comparison.
                </Text>
              </>
            )}
            <TouchableOpacity style={styles.scanNowBtn} onPress={() => router.push('/skinresult?routineCheck=true')}>
              <Ionicons name="camera-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.scanNowBtnText}>{baseScan ? 'Scan for Comparison' : 'Scan Now'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legendBlock}>
          <Text style={styles.legendTitle}>Condition Color Guide</Text>
          <View style={styles.legendRow}>
            {Object.entries(CONDITION_COLORS).map(([label, color]) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F6' },

  topNav: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  backBtn: {
    backgroundColor: '#fff', padding: 10, borderRadius: 12,
    shadowColor: '#E75480', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  welcomeText: { fontSize: 13, color: '#888', fontFamily: 'Nunito-Regular' },
  headerTitle: { fontSize: 24, color: '#2D2D2D', fontFamily: 'Nunito-ExtraBold' },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // ── Empty states ──
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: '#333', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: 'Nunito-Regular', color: '#888', textAlign: 'center', lineHeight: 20 },
  goRecsBtn: {
    marginTop: 24, backgroundColor: '#E75480', paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 14, elevation: 3,
  },
  goRecsBtnText: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15 },

  // ── Routine banner ──
  routineBanner: {
    borderRadius: 18, padding: 18, flexDirection: 'row',
    alignItems: 'center', marginBottom: 14,
  },
  routineBannerLeft: { flex: 1 },
  routineBannerLabel: { fontSize: 10, fontFamily: 'Nunito-Bold', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, marginBottom: 2 },
  routineBannerProduct: { fontSize: 18, fontFamily: 'Nunito-ExtraBold', color: '#fff', marginBottom: 2 },
  routineBannerMeta: { fontSize: 12, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.85)' },
  daysCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  daysNum: { fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: '#fff' },
  daysLabel: { fontSize: 10, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.85)' },

  scanProgressBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1.5, borderColor: '#FFE3ED',
    elevation: 1, shadowColor: '#E75480', shadowOpacity: 0.06, shadowRadius: 4,
  },
  scanProgressBtnText: {
    flex: 1, fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#E75480',
  },

  // ── Warning ──
  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF4E6', borderRadius: 14, padding: 14, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: '#E67E22',
  },
  warningTitle: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#E67E22' },
  warningSub: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#888', marginTop: 2 },
  switchBtn: {
    backgroundColor: '#E67E22', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10,
  },
  switchBtnText: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 13 },

  // ── Score ──
  scoreCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 2, shadowColor: '#E75480', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    marginBottom: 14,
  },
  scoreCardLeft: {},
  scoreLabel: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#888' },
  scoreValue: { fontSize: 36, fontFamily: 'Nunito-ExtraBold' },
  scoreSub: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#aaa' },

  // ── Pie charts ──
  piesBlock: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    elevation: 2, shadowColor: '#E75480', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    marginBottom: 14,
  },
  blockTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: '#1A1A1A', marginBottom: 14 },
  piesRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  pieCard: { alignItems: 'center' },
  pieLabel: { marginTop: 8, fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#555' },

  // ── Condition breakdown ──
  breakdownBlock: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    elevation: 2, shadowColor: '#E75480', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    marginBottom: 14,
  },
  condRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  condDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  condLabel: { width: 72, fontSize: 12, fontFamily: 'Nunito-SemiBold', color: '#555' },
  condBarBg: { flex: 1, height: 10, backgroundColor: '#F5F5F5', borderRadius: 5, overflow: 'hidden', position: 'relative' },
  condBar: { position: 'absolute', top: 0, left: 0, height: 10, borderRadius: 5 },
  condBarForeground: { zIndex: 1 },
  condDelta: { width: 40, fontSize: 12, fontFamily: 'Nunito-Bold', textAlign: 'right' },
  condLegend: { flexDirection: 'row', gap: 16, marginTop: 6 },
  condLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  condLegendSwatch: { width: 12, height: 12, borderRadius: 3 },
  condLegendText: { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#888' },

  // ── No scan ──
  noDataCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 24,
    alignItems: 'center', elevation: 2, marginBottom: 14,
  },
  noDataTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: '#333', marginTop: 12, marginBottom: 6 },
  noDataSub: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#888', textAlign: 'center', lineHeight: 19 },
  scanNowBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E75480', paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 14, marginTop: 16,
  },
  scanNowBtnText: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 14 },

  // ── Legend ──
  legendBlock: { backgroundColor: '#FFF0F3', borderRadius: 14, padding: 14, marginBottom: 10 },
  legendTitle: { fontSize: 13, fontFamily: 'Nunito-Bold', color: '#330033', marginBottom: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#888' },
})

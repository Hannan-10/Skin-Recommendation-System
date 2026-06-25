import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import { getActiveRoutine, clearActiveRoutine, markRoutineChecked, switchToNextProduct } from '../../firebase/user'
import PieChart from '../components/PieChart'

const CONDITION_COLORS = {
  acne:         '#E75480',
  wrinkles:     '#FF9DB3',
  pores:        '#FBC6D5',
  'dark spots': '#FADDE5',
  blackheads:   '#A78BFA',
}
const ALL_CONDITIONS = ['acne', 'wrinkles', 'pores', 'dark spots', 'blackheads']
const NO_IMPROVEMENT_THRESHOLD = 3

function pct(val) { return Math.round((val || 0) * 100) }

function buildPieData(conditions) {
  return ALL_CONDITIONS.map(label => {
    const match = (conditions || []).find(c => c.label === label)
    return { value: match ? pct(match.confidence) : 0, color: CONDITION_COLORS[label] || '#ccc', label }
  }).filter(d => d.value > 0)
}

function daysSince(ts) {
  if (!ts?.seconds) return 0
  return Math.floor((Date.now() - ts.seconds * 1000) / 86400000)
}

function compareScans(baseScan, currentScan) {
  const improvements = ALL_CONDITIONS.map(label => {
    const base    = baseScan?.conditions?.find(c => c.label === label)
    const current = currentScan?.conditions?.find(c => c.label === label)
    if (!base && !current) return null
    const basePct    = pct(base?.confidence    || 0)
    const currentPct = pct(current?.confidence || 0)
    const delta = basePct - currentPct
    return { label, basePct, currentPct, delta }
  }).filter(Boolean)

  const improvedCount     = improvements.filter(i => i.delta > 0).length
  const deterioratedCount = improvements.filter(i => i.delta < 0).length
  // Count-based score: positive whenever more conditions improved than worsened,
  // regardless of magnitude (avoids 3 small gains cancelling 2 large losses → "0%")
  const overallDelta      = improvements.length
    ? Math.round(((improvedCount - deterioratedCount) / improvements.length) * 100)
    : 0

  return { improvements, improvedCount, deterioratedCount, overallDelta }
}

export default function Progress() {
  const router = useRouter()
  const { freshScan: freshScanStr } = useLocalSearchParams()

  const freshScan = freshScanStr
    ? (() => { try { return JSON.parse(freshScanStr) } catch { return null } })()
    : null

  const [loading, setLoading]     = useState(true)
  const [routine, setRoutine]     = useState(null)
  const [switching, setSwitching]         = useState(false)
  const [switched, setSwitched]           = useState(null) // { name, brand } of new product
  const [switchModalVisible, setSwitchModalVisible] = useState(false)

  // Prevent marking the same scan twice
  const markedRef = useRef(false)

  const loadRoutine = useCallback(async () => {
    const r = await getActiveRoutine().catch(() => null)
    setRoutine(r)
    return r
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadRoutine().finally(() => setLoading(false))
    }, [])
  )

  // After fresh scan: mark check (once), then reload so noImprovementCount is current
  useEffect(() => {
    if (!freshScan || !routine || markedRef.current) return
    const base = routine.baseScan
    const hasComp = !!(base && (freshScan.savedAt || 0) > (base.savedAt || 0))
    if (!hasComp) return
    markedRef.current = true
    const { overallDelta } = compareScans(base, freshScan)
    ;(async () => {
      await markRoutineChecked(overallDelta <= 0).catch(() => {})
      await loadRoutine()
    })()
  }, [routine, freshScan])

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
  const currentScan = freshScan || routine.latestProgressScan || null

  const hasComparison = !!(
    baseScan && currentScan &&
    (currentScan.savedAt || 0) > (baseScan.savedAt || 0)
  )

  const { improvements, improvedCount, deterioratedCount, overallDelta } =
    hasComparison ? compareScans(baseScan, currentScan) : { improvements: [], improvedCount: 0, deterioratedCount: 0, overallDelta: 0 }

  const suggestSwitch = hasComparison && overallDelta < 0 && deterioratedCount > improvedCount

  // Next product logic
  const allProducts     = routine.allProducts || []
  const nextProductIdx  = (routine.productIndex || 0) + 1
  const nextProduct     = allProducts[nextProductIdx] || null
  const noProgressCount = routine.noImprovementCount || 0
  const hitThreshold    = noProgressCount >= NO_IMPROVEMENT_THRESHOLD

  const handleSwitchProduct = () => setSwitchModalVisible(true)

  const confirmSwitch = async () => {
    setSwitching(true)
    try {
      const scan = currentScan || baseScan
      const result = await switchToNextProduct({
        skinType: scan?.skinType || '',
        conditions: scan?.conditions || [],
        savedAt: scan?.savedAt || Date.now(),
      })
      setSwitchModalVisible(false)
      if (result.success) {
        setSwitched({ name: result.nextProduct?.name, brand: result.nextProduct?.brand })
        await loadRoutine()
      }
    } finally {
      setSwitching(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Switch Product Modal ── */}
      <Modal visible={switchModalVisible} transparent animationType="fade" onRequestClose={() => setSwitchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            {/* Header */}
            <LinearGradient colors={['#E75480', '#FF6B9D']} style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name="swap-horizontal" size={26} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Switch Product?</Text>
                <Text style={styles.modalHeaderSub}>No improvement after {NO_IMPROVEMENT_THRESHOLD} scans</Text>
              </View>
              <TouchableOpacity onPress={() => setSwitchModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>

              {/* Current product */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>CURRENT PRODUCT</Text>
                <View style={styles.modalProductRow}>
                  <View style={[styles.modalProductDot, { backgroundColor: '#FFE3ED' }]}>
                    <Ionicons name="close-circle" size={16} color="#E75480" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalProductName}>{routine.product?.name}</Text>
                    <Text style={styles.modalProductBrand}>{routine.product?.brand}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalArrowRow}>
                <View style={styles.modalDivider} />
                <View style={styles.modalArrowCircle}>
                  <Ionicons name="arrow-down" size={14} color="#E75480" />
                </View>
                <View style={styles.modalDivider} />
              </View>

              {/* Next product */}
              {nextProduct ? (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>SWITCH TO</Text>
                  <View style={[styles.modalProductRow, styles.modalProductRowNext]}>
                    <View style={[styles.modalProductDot, { backgroundColor: '#E3F9F0' }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#00C896" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalProductName}>{nextProduct.name}</Text>
                      <Text style={styles.modalProductBrand}>{nextProduct.brand}</Text>
                    </View>
                    <View style={styles.modalMatchBadge}>
                      <Text style={styles.modalMatchNum}>{nextProduct.match_pct || '--'}%</Text>
                      <Text style={styles.modalMatchLabel}>match</Text>
                    </View>
                  </View>
                  <Text style={styles.modalNote}>
                    Your most recent scan will become the new baseline for this product.
                  </Text>
                </View>
              ) : (
                <View style={styles.modalSection}>
                  <Text style={styles.modalNoMore}>
                    You've tried all our recommended products. Consider consulting a dermatologist for personalised advice.
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.modalBtns}>
                {nextProduct && (
                  <TouchableOpacity
                    style={[styles.modalSwitchBtn, switching && { opacity: 0.6 }]}
                    onPress={confirmSwitch}
                    disabled={switching}
                  >
                    {switching
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <>
                          <Ionicons name="swap-horizontal-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.modalSwitchBtnText}>Switch Now</Text>
                        </>}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setSwitchModalVisible(false)}
                  disabled={switching}
                >
                  <Text style={styles.modalCancelBtnText}>
                    {nextProduct ? 'Keep Going' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>
      </Modal>

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

        {/* ── Switched product success banner ── */}
        {switched && (
          <LinearGradient colors={['#00C896', '#00A87A']} style={styles.switchedBanner}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.switchedBannerTitle}>Product Switched!</Text>
              <Text style={styles.switchedBannerSub}>
                Now tracking with {switched.name}
                {switched.brand ? ` by ${switched.brand}` : ''}.
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSwitched(null)}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </LinearGradient>
        )}

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

        {/* ── Scan button — hidden once threshold reached ── */}
        {!hitThreshold && (
          <TouchableOpacity
            style={styles.scanProgressBtn}
            onPress={() => router.push('/skinresult?routineCheck=true')}
          >
            <Ionicons name="scan-outline" size={18} color="#E75480" />
            <Text style={styles.scanProgressBtnText}>Scan Skin to Check Progress</Text>
            <Ionicons name="chevron-forward" size={16} color="#E75480" />
          </TouchableOpacity>
        )}

        {/* ── 3-scan no-progress → switch product card ── */}
        {hitThreshold && (
          <View style={styles.switchCard}>
            <LinearGradient colors={['#E75480', '#FF6B9D']} style={styles.switchCardHeader}>
              <Ionicons name="swap-horizontal" size={18} color="#fff" />
              <Text style={styles.switchCardHeaderText}>Time to Try Something New</Text>
            </LinearGradient>
            <View style={styles.switchCardBody}>
              <Text style={styles.switchCardDesc}>
                After {noProgressCount} scans, no improvement was detected with{' '}
                <Text style={{ fontFamily: 'Nunito-Bold' }}>{routine.product?.name}</Text>.
              </Text>
              {nextProduct ? (
                <>
                  <View style={styles.nextProductRow}>
                    <View style={styles.nextProductIcon}>
                      <Ionicons name="sparkles-outline" size={18} color="#E75480" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nextProductLabel}>Next Recommended</Text>
                      <Text style={styles.nextProductName}>{nextProduct.name}</Text>
                      <Text style={styles.nextProductBrand}>{nextProduct.brand}</Text>
                    </View>
                    <View style={styles.nextMatchBadge}>
                      <Text style={styles.nextMatchNum}>{nextProduct.match_pct || '--'}%</Text>
                      <Text style={styles.nextMatchLabel}>match</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchNowBtn, switching && { opacity: 0.6 }]}
                    onPress={handleSwitchProduct}
                    disabled={switching}
                  >
                    {switching
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <>
                          <Ionicons name="swap-horizontal-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.switchNowBtnText}>Switch to This Product</Text>
                        </>}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.noMoreWrap}>
                  <Text style={styles.noMoreProducts}>
                    You've tried all recommended products. It's time to see a professional.
                  </Text>
                  <TouchableOpacity
                    style={styles.findDermBtn}
                    onPress={() => { setSwitchModalVisible(false); router.push('/dermatologists') }}
                  >
                    <Ionicons name="location-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.findDermBtnText}>Find Nearby Dermatologist</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Immediate deterioration warning (single bad scan) ── */}
        {!hitThreshold && suggestSwitch && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={20} color="#E67E22" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Skin conditions worsening</Text>
              <Text style={styles.warningSub}>
                Keep scanning — if no improvement after {NO_IMPROVEMENT_THRESHOLD} scans, we'll suggest a switch.
              </Text>
            </View>
          </View>
        )}

        {/* ── Comparison results ── */}
        {hasComparison ? (
          <>
            <View style={styles.scoreCard}>
              <View style={styles.scoreCardLeft}>
                <Text style={styles.scoreLabel}>Overall Skin Change</Text>
                <Text style={[
                  styles.scoreValue,
                  { color: overallDelta > 0 ? '#00C896' : overallDelta < 0 ? '#E75480' : '#888' }
                ]}>
                  {overallDelta > 0 ? '+' : ''}{overallDelta}%
                </Text>
                <Text style={styles.scoreSub}>
                  {improvedCount > 0
                    ? `${improvedCount} condition${improvedCount > 1 ? 's' : ''} improved`
                    : deterioratedCount > 0
                    ? `${deterioratedCount} condition${deterioratedCount > 1 ? 's' : ''} worsened`
                    : 'No change detected'}
                </Text>
              </View>
              <Ionicons
                name={overallDelta > 0 ? 'trending-up' : overallDelta < 0 ? 'trending-down' : 'remove-outline'}
                size={40}
                color={overallDelta > 0 ? '#00C896' : overallDelta < 0 ? '#E75480' : '#aaa'}
              />
            </View>

            <View style={styles.piesBlock}>
              <Text style={styles.blockTitle}>Skin Condition Comparison</Text>
              <View style={styles.piesRow}>
                <View style={styles.pieCard}>
                  <PieChart data={buildPieData(baseScan.conditions)} size={110} />
                  <Text style={styles.pieLabel}>Before</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#E75480" style={{ alignSelf: 'center' }} />
                <View style={styles.pieCard}>
                  <PieChart data={buildPieData(currentScan.conditions)} size={110} />
                  <Text style={styles.pieLabel}>After</Text>
                </View>
              </View>
            </View>

            <View style={styles.breakdownBlock}>
              <Text style={styles.blockTitle}>Condition Breakdown</Text>
              {improvements.map(item => (
                <View key={item.label} style={styles.condRow}>
                  <View style={[styles.condDot, { backgroundColor: CONDITION_COLORS[item.label] || '#ccc' }]} />
                  <Text style={styles.condLabel}>
                    {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                  </Text>
                  <View style={styles.condBarsWrap}>
                    <View style={styles.condBarRow}>
                      <Text style={styles.condBarTag}>Before</Text>
                      <View style={styles.condBarBg}>
                        <View style={[styles.condBarFill, {
                          width: `${item.basePct}%`,
                          backgroundColor: (CONDITION_COLORS[item.label] || '#ccc') + '66',
                        }]} />
                      </View>
                      <Text style={styles.condBarPct}>{item.basePct}%</Text>
                    </View>
                    <View style={styles.condBarRow}>
                      <Text style={styles.condBarTag}>After</Text>
                      <View style={styles.condBarBg}>
                        <View style={[styles.condBarFill, {
                          width: `${item.currentPct}%`,
                          backgroundColor: CONDITION_COLORS[item.label] || '#ccc',
                        }]} />
                      </View>
                      <Text style={styles.condBarPct}>{item.currentPct}%</Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.condDelta,
                    { color: item.delta > 0 ? '#00C896' : item.delta < 0 ? '#E75480' : '#aaa' }
                  ]}>
                    {item.delta > 0 ? '↓' : item.delta < 0 ? '↑' : '–'}{Math.abs(item.delta)}%
                  </Text>
                </View>
              ))}

              <View style={styles.legendInline}>
                <View style={styles.legendInlineItem}>
                  <View style={[styles.legendInlineSwatch, { opacity: 0.4, backgroundColor: '#E75480' }]} />
                  <Text style={styles.legendInlineText}>Before (faded)</Text>
                </View>
                <View style={styles.legendInlineItem}>
                  <View style={[styles.legendInlineSwatch, { backgroundColor: '#E75480' }]} />
                  <Text style={styles.legendInlineText}>After (solid)</Text>
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
                  Scan your skin now to set your baseline. After using the product, scan again to compare.
                </Text>
              </>
            )}
            <TouchableOpacity style={styles.scanNowBtn} onPress={() => router.push('/skinresult?routineCheck=true')}>
              <Ionicons name="camera-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.scanNowBtnText}>{baseScan ? 'Scan for Comparison' : 'Scan Now'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Scan count indicator ── */}
        {noProgressCount > 0 && (
          <View style={styles.scanCountRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#E67E22" />
            <Text style={styles.scanCountText}>
              {noProgressCount}/{NO_IMPROVEMENT_THRESHOLD} scans with no improvement detected
            </Text>
          </View>
        )}

        {/* ── Condition color guide ── */}
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

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: '#333', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: 'Nunito-Regular', color: '#888', textAlign: 'center', lineHeight: 20 },
  goRecsBtn: {
    marginTop: 24, backgroundColor: '#E75480', paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 14, elevation: 3,
  },
  goRecsBtnText: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15 },

  switchedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 14, marginBottom: 14,
  },
  switchedBannerTitle: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#fff' },
  switchedBannerSub: { fontSize: 12, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.9)', marginTop: 1 },

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

  // Switch product card
  switchCard: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 14,
    elevation: 3, shadowColor: '#E75480', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  switchCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  switchCardHeaderText: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#fff' },
  switchCardBody: { backgroundColor: '#fff', padding: 14, gap: 12 },
  switchCardDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#555', lineHeight: 18 },
  nextProductRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF0F3', borderRadius: 12, padding: 12,
  },
  nextProductIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFE3ED',
    alignItems: 'center', justifyContent: 'center',
  },
  nextProductLabel: { fontSize: 10, fontFamily: 'Nunito-SemiBold', color: '#aaa', textTransform: 'uppercase', marginBottom: 2 },
  nextProductName: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#1A1A1A' },
  nextProductBrand: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#888' },
  nextMatchBadge: { alignItems: 'center' },
  nextMatchNum: { fontSize: 18, fontFamily: 'Nunito-ExtraBold', color: '#00C896' },
  nextMatchLabel: { fontSize: 9, fontFamily: 'Nunito-Regular', color: '#888' },
  switchNowBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E75480', paddingVertical: 12, borderRadius: 12,
    elevation: 2,
  },
  switchNowBtnText: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 14 },
  noMoreWrap: { gap: 12 },
  noMoreProducts: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#888', textAlign: 'center', lineHeight: 18 },
  findDermBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6D4DF2', paddingVertical: 12, borderRadius: 12, elevation: 2,
  },
  findDermBtnText: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#fff' },

  // Warning card (immediate bad scan, not yet threshold)
  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF4E6', borderRadius: 14, padding: 14, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: '#E67E22',
  },
  warningTitle: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#E67E22' },
  warningSub: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#888', marginTop: 2 },

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

  piesBlock: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    elevation: 2, shadowColor: '#E75480', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    marginBottom: 14,
  },
  blockTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: '#1A1A1A', marginBottom: 14 },
  piesRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  pieCard: { alignItems: 'center' },
  pieLabel: { marginTop: 8, fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#555' },

  breakdownBlock: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    elevation: 2, shadowColor: '#E75480', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    marginBottom: 14,
  },
  condRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 14 },
  condDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  condLabel: { width: 72, fontSize: 12, fontFamily: 'Nunito-SemiBold', color: '#555', paddingTop: 2 },
  condBarsWrap: { flex: 1, gap: 4 },
  condBarRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  condBarTag: { width: 32, fontSize: 9, fontFamily: 'Nunito-SemiBold', color: '#aaa' },
  condBarBg: { flex: 1, height: 8, backgroundColor: '#F5F5F5', borderRadius: 4, overflow: 'hidden' },
  condBarFill: { height: 8, borderRadius: 4 },
  condBarPct: { width: 28, fontSize: 10, fontFamily: 'Nunito-Bold', color: '#555', textAlign: 'right' },
  condDelta: { width: 36, fontSize: 12, fontFamily: 'Nunito-Bold', textAlign: 'right', paddingTop: 2 },

  legendInline: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendInlineItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendInlineSwatch: { width: 12, height: 12, borderRadius: 3 },
  legendInlineText: { fontSize: 11, fontFamily: 'Nunito-Regular', color: '#888' },

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

  scanCountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF4E6', borderRadius: 10, padding: 10, marginBottom: 12,
  },
  scanCountText: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: '#E67E22' },

  legendBlock: { backgroundColor: '#FFF0F3', borderRadius: 14, padding: 14, marginBottom: 10 },
  legendTitle: { fontSize: 13, fontFamily: 'Nunito-Bold', color: '#330033', marginBottom: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#888' },

  // ── Switch Product Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 24,
    overflow: 'hidden', elevation: 12,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 16,
  },
  modalHeaderIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalHeaderTitle: { fontSize: 17, fontFamily: 'Nunito-ExtraBold', color: '#fff' },
  modalHeaderSub: { fontSize: 12, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: 18, gap: 4 },
  modalSection: { gap: 8 },
  modalSectionLabel: {
    fontSize: 10, fontFamily: 'Nunito-Bold', color: '#aaa',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  modalProductRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF9F6', borderRadius: 14, padding: 12,
  },
  modalProductRowNext: { backgroundColor: '#F0FBF7' },
  modalProductDot: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  modalProductName: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#1A1A1A' },
  modalProductBrand: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#888', marginTop: 1 },
  modalMatchBadge: { alignItems: 'center' },
  modalMatchNum: { fontSize: 18, fontFamily: 'Nunito-ExtraBold', color: '#00C896' },
  modalMatchLabel: { fontSize: 9, fontFamily: 'Nunito-Regular', color: '#aaa' },
  modalArrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  modalDivider: { flex: 1, height: 1, backgroundColor: '#F0F0F0' },
  modalArrowCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#FFE3ED', alignItems: 'center', justifyContent: 'center',
  },
  modalNote: {
    fontSize: 12, fontFamily: 'Nunito-Regular', color: '#888',
    lineHeight: 17, paddingHorizontal: 2,
  },
  modalNoMore: {
    fontSize: 13, fontFamily: 'Nunito-Regular', color: '#888',
    textAlign: 'center', lineHeight: 19, paddingVertical: 8,
  },
  modalBtns: { gap: 10, marginTop: 10 },
  modalSwitchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E75480', paddingVertical: 14, borderRadius: 14,
    elevation: 3, shadowColor: '#E75480', shadowOpacity: 0.3, shadowRadius: 8,
  },
  modalSwitchBtnText: { fontSize: 16, fontFamily: 'Nunito-Bold', color: '#fff' },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 12 },
  modalCancelBtnText: { fontSize: 15, fontFamily: 'Nunito-SemiBold', color: '#aaa' },
})

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { saveActiveRoutine, getLastScanResult } from '../firebase/user';

const MORNING_TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00'];
const EVENING_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00'];

function fmt(time) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

const CATEGORY_ICONS = {
  Cleanser: 'water-outline',
  Serum: 'flask-outline',
  Moisturizer: 'leaf-outline',
  Sunscreen: 'sunny-outline',
  Treatment: 'bandage-outline',
};

export default function RoutineSetup() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const product = params.product ? JSON.parse(params.product) : null;
  const productIndex = parseInt(params.productIndex || '0', 10);

  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('21:00');
  const [useMorning, setUseMorning] = useState(true);
  const [useEvening, setUseEvening] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routineSaved, setRoutineSaved] = useState(false);

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.errorText}>No product selected.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCenter}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleStart = async () => {
    const times = [];
    if (useMorning) times.push(morningTime);
    if (useEvening) times.push(eveningTime);
    if (times.length === 0) {
      times.push('08:00');
    }

    setSaving(true);
    try {
      const baseScan = await getLastScanResult().catch(() => null);
      await saveActiveRoutine({
        productIndex,
        product: {
          name:     product.name     || '',
          brand:    product.brand    || '',
          type:     product.type     || '',
          category: product._category || '',
        },
        routineTimes: times,
        baseScan: baseScan ? {
          skinType:   baseScan.skinType,
          conditions: baseScan.conditions || [],
          scannedAt:  baseScan.scannedAt  || null,
        } : null,
      });
    } catch (e) {
      // Non-fatal
    } finally {
      setSaving(false);
      setRoutineSaved(true);
    }
  };

  const icon = CATEGORY_ICONS[product._category] || 'sparkles-outline';

  // ── Routine saved confirmation ──────────────────────────────────────────────
  if (routineSaved) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.savedScreen}>
          <LinearGradient colors={['#E75480', '#FF6B9D']} style={styles.savedIconWrap}>
            <Ionicons name="checkmark-circle" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.savedTitle}>Routine Started!</Text>
          <Text style={styles.savedSub}>
            <Text style={{ fontFamily: 'Nunito-Bold', color: '#1A1A1A' }}>{product.name}</Text>
            {'\n'}is now your active routine product.
          </Text>

          <View style={styles.savedActions}>
            <TouchableOpacity
              style={styles.savedScanBtn}
              onPress={() => router.replace('/skinresult?mode=camera&routineCheck=true')}
            >
              <Ionicons name="scan-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.savedScanBtnText}>Scan Skin Now</Text>
            </TouchableOpacity>
            <Text style={styles.savedScanHint}>
              Scan at any time to track how your skin improves
            </Text>
            <TouchableOpacity
              style={styles.savedHomeBtn}
              onPress={() => router.replace('/(drawer)/(tabs)/home')}
            >
              <Text style={styles.savedHomeBtnText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#E75480', '#FF6B9D', '#FFB3CC']} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerIconWrap}>
            <Ionicons name={icon} size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Set Up Your Routine</Text>
          <Text style={styles.headerSub}>
            We'll remind you each day and track your skin progress
          </Text>
        </LinearGradient>

        {/* Selected product card */}
        <View style={styles.productCard}>
          <View style={styles.productCardLeft}>
            <View style={styles.productIconBg}>
              <Ionicons name={icon} size={22} color="#E75480" />
            </View>
            <View>
              <Text style={styles.productBrand}>{product.brand || 'Product'}</Text>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              {product._category && (
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{product._category}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.matchBadge}>
            <Text style={styles.matchNum}>{product.match_pct || '--'}%</Text>
            <Text style={styles.matchLabel}>match</Text>
          </View>
        </View>

        {/* Morning routine */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sunny-outline" size={18} color="#E75480" />
            <Text style={styles.cardTitle}>Morning Routine</Text>
            <TouchableOpacity
              style={[styles.toggle, useMorning && styles.toggleOn]}
              onPress={() => setUseMorning(v => !v)}
            >
              <View style={[styles.toggleKnob, useMorning && styles.toggleKnobOn]} />
            </TouchableOpacity>
          </View>
          {useMorning && (
            <>
              <Text style={styles.cardSub}>Select your morning application time</Text>
              <View style={styles.timeChips}>
                {MORNING_TIMES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, morningTime === t && styles.timeChipActive]}
                    onPress={() => setMorningTime(t)}
                  >
                    <Text style={[styles.timeChipText, morningTime === t && styles.timeChipTextActive]}>
                      {fmt(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Evening routine */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon-outline" size={18} color="#E75480" />
            <Text style={styles.cardTitle}>Evening Routine</Text>
            <TouchableOpacity
              style={[styles.toggle, useEvening && styles.toggleOn]}
              onPress={() => setUseEvening(v => !v)}
            >
              <View style={[styles.toggleKnob, useEvening && styles.toggleKnobOn]} />
            </TouchableOpacity>
          </View>
          {useEvening && (
            <>
              <Text style={styles.cardSub}>Select your evening application time</Text>
              <View style={styles.timeChips}>
                {EVENING_TIMES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, eveningTime === t && styles.timeChipActive]}
                    onPress={() => setEveningTime(t)}
                  >
                    <Text style={[styles.timeChipText, eveningTime === t && styles.timeChipTextActive]}>
                      {fmt(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* How it works */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How progress tracking works</Text>
          {[
            { icon: 'notifications-outline', text: 'Open the app daily — we\'ll check if you\'ve used the product' },
            { icon: 'scan-outline',           text: 'After use, optionally scan your skin to measure improvement' },
            { icon: 'bar-chart-outline',       text: 'See before vs. after charts in the Progress tab' },
            { icon: 'swap-horizontal-outline', text: 'No improvement after 2 checks? We suggest your next product' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.infoIconBg}>
                <Ionicons name={item.icon} size={16} color="#E75480" />
              </View>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startBtn, saving && { opacity: 0.7 }]}
          onPress={handleStart}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="play-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.startBtnText}>Start Routine</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9F6' },
  container: { paddingBottom: 40 },

  errorText: { fontSize: 16, color: '#888', fontFamily: 'Nunito-Regular' },
  backBtnCenter: { marginTop: 16, padding: 12 },
  backBtnText: { color: '#E75480', fontFamily: 'Nunito-Bold' },

  header: {
    paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center',
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Nunito-ExtraBold', color: '#fff', textAlign: 'center', marginBottom: 6 },
  headerSub: { fontSize: 13, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.9)', textAlign: 'center' },

  productCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginTop: 16,
    padding: 14, elevation: 2, shadowColor: '#E75480', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  productCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  productIconBg: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFE3ED',
    alignItems: 'center', justifyContent: 'center',
  },
  productBrand: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#aaa', textTransform: 'uppercase' },
  productName: { fontSize: 15, fontFamily: 'Nunito-Bold', color: '#1A1A1A', maxWidth: 180 },
  categoryChip: {
    marginTop: 4, alignSelf: 'flex-start',
    backgroundColor: '#FFE3ED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  categoryChipText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#E75480' },
  matchBadge: { alignItems: 'center' },
  matchNum: { fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: '#00C896' },
  matchLabel: { fontSize: 10, fontFamily: 'Nunito-Regular', color: '#888' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginTop: 14,
    padding: 16, elevation: 2, shadowColor: '#E75480', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 16, fontFamily: 'Nunito-ExtraBold', color: '#1A1A1A' },
  cardSub: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#888', marginBottom: 12, marginTop: 4 },

  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: '#ddd',
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: '#E75480' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleKnobOn: { alignSelf: 'flex-end' },

  timeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#FDE2E8', backgroundColor: '#FFF9F6',
  },
  timeChipActive: { borderColor: '#E75480', backgroundColor: '#FFE3ED' },
  timeChipText: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#555' },
  timeChipTextActive: { color: '#E75480' },

  infoCard: {
    backgroundColor: '#F3EFFE', borderRadius: 16, marginHorizontal: 16, marginTop: 14, padding: 16, gap: 10,
  },
  infoTitle: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#6D4DF2', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconBg: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Nunito-Regular', color: '#555', lineHeight: 18 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E75480', marginHorizontal: 16, marginTop: 24,
    paddingVertical: 16, borderRadius: 16, elevation: 4,
    shadowColor: '#E75480', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  startBtnText: { fontSize: 17, fontFamily: 'Nunito-Bold', color: '#fff' },

  cancelBtn: { alignItems: 'center', marginTop: 14, paddingVertical: 10 },
  cancelBtnText: { fontSize: 15, fontFamily: 'Nunito-SemiBold', color: '#aaa', textDecorationLine: 'underline' },

  savedScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  savedIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  savedTitle: {
    fontSize: 28, fontFamily: 'Nunito-ExtraBold', color: '#1A1A1A', marginBottom: 10,
  },
  savedSub: {
    fontSize: 15, fontFamily: 'Nunito-Regular', color: '#888',
    textAlign: 'center', lineHeight: 22, marginBottom: 36,
  },
  savedActions: { width: '100%', gap: 12 },
  savedScanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E75480', paddingVertical: 16, borderRadius: 16,
    elevation: 4, shadowColor: '#E75480', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  savedScanBtnText: { fontSize: 17, fontFamily: 'Nunito-Bold', color: '#fff' },
  savedScanHint: {
    fontSize: 12, fontFamily: 'Nunito-Regular', color: '#aaa', textAlign: 'center',
  },
  savedHomeBtn: {
    alignItems: 'center', paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#FDE2E8',
  },
  savedHomeBtnText: { fontSize: 15, fontFamily: 'Nunito-SemiBold', color: '#E75480' },
});

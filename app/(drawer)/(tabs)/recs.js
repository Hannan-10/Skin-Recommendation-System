import React, { useEffect, useState, useRef } from 'react';
import { API_BASE } from '../../config';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { getCurrentUserProfile, getLastScanResult, getAllergyProfile } from '../../../firebase/user';

const { width: SCREEN_W } = Dimensions.get('window');
const CONFIDENCE_THRESHOLD = 0.35;

// ── Category product images ───────────────────────────────────────────────────
const CATEGORY_IMAGES = {
  Cleanser:    require('../../../assets/images/c1.jpg'),
  Serum:       require('../../../assets/images/serum1.jpg'),
  Moisturizer: require('../../../assets/images/moist2.jpg'),
  Sunscreen:   require('../../../assets/images/s1.webp'),
  Treatment:   require('../../../assets/images/serm1.jpg'),
};

// ── Category visual config ────────────────────────────────────────────────────
const CATEGORY_CFG = {
  Cleanser:    { icon: 'water-outline',   colors: ['#43E8C8', '#1CB5A0'], lightColor: '#E6FBF7' },
  Serum:       { icon: 'flask-outline',   colors: ['#FF6B9D', '#C94087'], lightColor: '#FFEBF3' },
  Moisturizer: { icon: 'leaf-outline',    colors: ['#FFB347', '#E8870A'], lightColor: '#FFF4E6' },
  Sunscreen:   { icon: 'sunny-outline',   colors: ['#F9D423', '#F0801A'], lightColor: '#FFFAE6' },
  Treatment:   { icon: 'bandage-outline', colors: ['#A78BFA', '#6D4DF2'], lightColor: '#F3EFFE' },
};

// ── Condition chip colors ─────────────────────────────────────────────────────
const COND_COLOR = {
  acne:        { bg: '#FFEBEB', text: '#D63031' },
  blackheads:  { bg: '#EBF3FF', text: '#2D71C8' },
  'dark spots':{ bg: '#F0EBFF', text: '#6C3FC9' },
  pores:       { bg: '#E6FBF4', text: '#00916E' },
  wrinkles:    { bg: '#FFEDF5', text: '#C0315E' },
};

// ── Skin type display config ──────────────────────────────────────────────────
const TYPE_CFG = {
  oil:    { label: 'OILY',        bg: '#FFEBF3', text: '#C0315E', icon: 'water' },
  dry:    { label: 'DRY',         bg: '#EBF3FF', text: '#2D71C8', icon: 'sunny-outline' },
  normal: { label: 'NORMAL',      bg: '#E6FBF4', text: '#00916E', icon: 'checkmark-circle' },
};

// ── Benefit tag color (cycles) ────────────────────────────────────────────────
const BENEFIT_COLORS = ['#E6FBF4', '#EBF3FF', '#FFF4E6', '#FFEBF3', '#F3EFFE'];
const BENEFIT_TEXT   = ['#00916E', '#2D71C8', '#C47A15', '#C0315E', '#6D4DF2'];

// ─────────────────────────────────────────────────────────────────────────────
// ProductCard
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ product, categoryKey, index, productIndex }) {
  const router = useRouter();
  const cfg = CATEGORY_CFG[categoryKey] || CATEGORY_CFG.Serum;
  const initial = (product.brand || '?').charAt(0).toUpperCase();
  const pct = product.match_pct || 0;
  const matchColor = pct >= 70 ? '#00C896' : pct >= 45 ? '#FFB347' : '#FF7675';
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.card,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      {/* Gradient top section */}
      <LinearGradient colors={cfg.colors} style={styles.cardTop}>
        {/* Product image */}
        <View style={styles.productImageWrap}>
          <Image
            source={CATEGORY_IMAGES[categoryKey] || CATEGORY_IMAGES.Serum}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* Category micro-badge */}
        <View style={styles.catBadge}>
          <Text style={styles.catBadgeText}>{product.type?.toUpperCase()}</Text>
        </View>

        {/* Match % badge */}
        <View style={[styles.matchBadge, { borderColor: matchColor }]}>
          <Text style={[styles.matchPct, { color: matchColor }]}>{pct}%</Text>
          <Text style={styles.matchLabel}>match</Text>
        </View>
      </LinearGradient>

      {/* Card body */}
      <View style={styles.cardBody}>
        <Text style={styles.cardBrand} numberOfLines={1}>{product.brand}</Text>
        <Text style={styles.cardName}  numberOfLines={2}>{product.name}</Text>

        {/* Benefit tags */}
        <View style={styles.tagRow}>
          {(product.beneficial || []).slice(0, 2).map((b, i) => (
            <View
              key={i}
              style={[styles.benefitTag, { backgroundColor: BENEFIT_COLORS[i % BENEFIT_COLORS.length] }]}
            >
              <Text style={[styles.benefitTagText, { color: BENEFIT_TEXT[i % BENEFIT_TEXT.length] }]}
                    numberOfLines={1}>
                {b}
              </Text>
            </View>
          ))}
        </View>

        {/* Start Routine button */}
        <TouchableOpacity
          style={styles.routineBtn}
          onPress={() => router.push({
            pathname: '/routinesetup',
            params: {
              productIndex,
              product: JSON.stringify({ ...product, _category: categoryKey }),
            },
          })}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle-outline" size={13} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.routineBtnText}>Start Routine</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CategorySection
// ─────────────────────────────────────────────────────────────────────────────
function CategorySection({ categoryKey, products }) {
  const cfg = CATEGORY_CFG[categoryKey] || CATEGORY_CFG.Serum;

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <LinearGradient colors={cfg.colors} style={styles.sectionIconBg}>
          <Ionicons name={cfg.icon} size={16} color="#fff" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>{categoryKey} Picks</Text>
        <View style={[styles.countPill, { backgroundColor: cfg.lightColor }]}>
          <Text style={[styles.countText, { color: cfg.colors[1] }]}>
            {products.length} found
          </Text>
        </View>
      </View>

      {/* Products */}
      {products.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
        >
          {products.map((p, i) => (
            <ProductCard key={i} product={p} categoryKey={categoryKey} index={i} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptySection}>
          <Ionicons name="search-outline" size={28} color="#DDD" />
          <Text style={styles.emptySectionText}>No strong matches for this category</Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Recs Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function Recs() {
  const router  = useRouter();
  const params  = useLocalSearchParams();

  const [profile, setProfile]               = useState(null);
  const [scanData, setScanData]             = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  const pageAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadEverything();
  }, []);

  const loadEverything = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prof, lastScan, allergyProfile] = await Promise.all([
        getCurrentUserProfile().catch(() => null),
        getLastScanResult().catch(() => null),
        getAllergyProfile().catch(() => null),
      ]);
      setProfile(prof);

      // Resolve skin type + conditions (params take priority over Firebase)
      let skinType = params.skinType || lastScan?.skinType || null;
      let conditions = [];

      if (params.conditions) {
        try { conditions = JSON.parse(params.conditions); } catch {}
      } else if (lastScan?.conditions) {
        conditions = lastScan.conditions;
      }

      if (!skinType) {
        setLoading(false);
        return;
      }

      setScanData({ skinType, conditions });

      const filteredConds = (conditions || [])
        .filter(c => (c.confidence || 0) >= CONFIDENCE_THRESHOLD)
        .map(c => c.label);

      const res = await fetch(`${API_BASE}/recommend`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          skin_type:   skinType,
          conditions:  filteredConds,
          age:         prof?.age   || 25,
          gender:      prof?.gender || '',
          allergens:   allergyProfile?.allergens    || [],
          sensitivities: allergyProfile?.sensitivities || [],
        }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      setRecommendations(json.recommendations);

      Animated.timing(pageAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }).start();
    } catch (e) {
      setError('Could not load recommendations. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centeredState}>
          <View style={styles.loadingPulse}>
            <ActivityIndicator size="large" color="#E75480" />
          </View>
          <Text style={styles.loadingTitle}>Finding Your Match</Text>
          <Text style={styles.loadingSubtitle}>
            Analyzing your skin profile and scanning 17,000+ products…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── No scan yet ────────────────────────────────────────────────────────────
  if (!scanData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={styles.centeredState}>
          <LinearGradient colors={['#FFE3ED', '#FFF9F6', '#FFF9F6']} style={styles.noScanGradient}>
            <View style={styles.noScanIconWrap}>
              <LinearGradient colors={['#FF6B9D', '#E75480']} style={styles.noScanIconBg}>
                <Ionicons name="scan-outline" size={42} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.noScanTitle}>No Skin Analysis Yet</Text>
            <Text style={styles.noScanSub}>
              Scan your face once to unlock AI-powered product recommendations tailored exactly to your skin.
            </Text>

            {/* Feature highlights */}
            {[
              { icon: 'sparkles-outline', text: 'Matched to your skin type & conditions' },
              { icon: 'shield-checkmark-outline', text: 'Harmful ingredients filtered out' },
              { icon: 'star-outline', text: 'Top-rated dermatologist-approved brands' },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIconBg}>
                  <Ionicons name={f.icon} size={16} color="#E75480" />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.scanNowBtn} onPress={() => router.push('/skinscan')}>
              <Ionicons name="scan" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.scanNowBtnText}>Start Skin Scan</Text>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centeredState}>
          <Ionicons name="wifi-outline" size={50} color="#ccc" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadEverything}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  const typeCfg = TYPE_CFG[scanData.skinType] || { label: scanData.skinType?.toUpperCase(), bg: '#F0F0F0', text: '#555', icon: 'person-outline' };
  const topConds = (scanData.conditions || [])
    .filter(c => c.confidence >= CONFIDENCE_THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  const topProducts = Object.entries(recommendations || {})
    .flatMap(([cat, prods]) => prods.map(p => ({ ...p, _category: cat })))
    .sort((a, b) => (b.match_pct || 0) - (a.match_pct || 0))
    .slice(0, 4);

  const totalMatches = topProducts.length;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ opacity: pageAnim }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── HERO HEADER ── */}
        <LinearGradient colors={['#E75480', '#FF6B9D', '#FFB3CC', '#FFF9F6']} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>PERSONALIZED FOR YOU</Text>
              <Text style={styles.heroTitle}>Your Skincare{'\n'}Match</Text>
            </View>
            <TouchableOpacity onPress={loadEverything} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatBox}>
              <Text style={styles.heroStatNum}>{totalMatches}</Text>
              <Text style={styles.heroStatLabel}>Products</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatBox}>
              <Text style={styles.heroStatNum}>{Object.keys(CATEGORY_CFG).length}</Text>
              <Text style={styles.heroStatLabel}>Categories</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatBox}>
              <Text style={styles.heroStatNum}>AI</Text>
              <Text style={styles.heroStatLabel}>Powered</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── SKIN PROFILE CARD ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <View style={styles.profileCardTitleRow}>
              <Ionicons name="person-circle" size={20} color="#E75480" />
              <Text style={styles.profileCardTitle}>Your Skin DNA</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/skinscan')} style={styles.rescanBtn}>
              <Ionicons name="scan-outline" size={13} color="#E75480" />
              <Text style={styles.rescanBtnText}>Re-Scan</Text>
            </TouchableOpacity>
          </View>

          {/* Skin type */}
          <View style={styles.profileRow}>
            <Text style={styles.profileRowLabel}>Skin Type</Text>
            <View style={[styles.typeChip, { backgroundColor: typeCfg.bg }]}>
              <Ionicons name={typeCfg.icon} size={13} color={typeCfg.text} style={{ marginRight: 4 }} />
              <Text style={[styles.typeChipText, { color: typeCfg.text }]}>{typeCfg.label}</Text>
            </View>
          </View>

          {/* Conditions */}
          {topConds.length > 0 && (
            <View style={styles.profileRow}>
              <Text style={styles.profileRowLabel}>Conditions</Text>
              <View style={styles.condChipRow}>
                {topConds.map((c, i) => {
                  const col = COND_COLOR[c.label] || { bg: '#F5F5F5', text: '#555' };
                  return (
                    <View key={i} style={[styles.condChip, { backgroundColor: col.bg }]}>
                      <Text style={[styles.condChipText, { color: col.text }]}>
                        {c.label.charAt(0).toUpperCase() + c.label.slice(1)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {profile?.name && (
            <View style={styles.profileNameRow}>
              <Ionicons name="sparkles" size={13} color="#E75480" />
              <Text style={styles.profileNameText}>
                Matched for {profile.name}
                {profile.age ? `, ${profile.age} yrs` : ''}
                {profile.gender ? ` · ${profile.gender}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* ── HOW IT WORKS BANNER ── */}
        <LinearGradient colors={['#F3EFFE', '#EBF3FF']} style={styles.howBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#6D4DF2" />
          <Text style={styles.howBannerText}>
            Products are ranked by how well their ingredients match your skin type and conditions.
          </Text>
        </LinearGradient>

        {/* ── TOP PICKS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient colors={['#E75480', '#FF6B9D']} style={styles.sectionIconBg}>
              <Ionicons name="star" size={16} color="#fff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Top Picks For You</Text>
            <View style={[styles.countPill, { backgroundColor: '#FFEBF3' }]}>
              <Text style={[styles.countText, { color: '#C0315E' }]}>
                {topProducts.length} products
              </Text>
            </View>
          </View>
          <View style={styles.topPicksList}>
            {topProducts.map((p, i) => (
              <ProductCard key={i} product={p} categoryKey={p._category} index={i} productIndex={i} />
            ))}
          </View>
        </View>

        {/* ── DISCLAIMER ── */}
        <View style={styles.disclaimer}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#aaa" />
          <Text style={styles.disclaimerText}>
            Recommendations are AI-generated based on ingredient analysis. Always patch test before use and consult a dermatologist for medical concerns.
          </Text>
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F6' },

  // ── Loading / empty states ─────────────────────────────────────────────────
  centeredState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 500,
  },
  loadingPulse: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFE3ED', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 22, fontFamily: 'Nunito-ExtraBold', color: '#1A1A1A', marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14, fontFamily: 'Nunito-Regular', color: '#888', textAlign: 'center', lineHeight: 22,
  },

  // ── No scan ────────────────────────────────────────────────────────────────
  noScanGradient: {
    width: '100%', borderRadius: 24, padding: 28, alignItems: 'center',
  },
  noScanIconWrap: { marginBottom: 20 },
  noScanIconBg: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  noScanTitle: {
    fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: '#1A1A1A',
    marginBottom: 10, textAlign: 'center',
  },
  noScanSub: {
    fontSize: 14, fontFamily: 'Nunito-Regular', color: '#666',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'stretch', marginBottom: 12,
  },
  featureIconBg: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFE3ED',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1, fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#333',
  },
  scanNowBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E75480',
    paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 30, marginTop: 20,
    elevation: 4, shadowColor: '#E75480',
    shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  scanNowBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito-Bold' },

  // ── Error state ────────────────────────────────────────────────────────────
  errorTitle: {
    fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: '#333',
    marginTop: 16, marginBottom: 8,
  },
  errorSub: {
    fontSize: 13, fontFamily: 'Nunito-Regular', color: '#888',
    textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#E75480',
    paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 25,
  },
  retryBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Nunito-Bold' },

  // ── Hero ───────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30,
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  heroLabel: {
    fontSize: 11, fontFamily: 'Nunito-Bold', color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.2, marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28, fontFamily: 'Nunito-ExtraBold', color: '#fff', lineHeight: 34,
  },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroStats: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16, padding: 16, alignItems: 'center',
  },
  heroStatBox: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: 22, fontFamily: 'Nunito-ExtraBold', color: '#fff' },
  heroStatLabel: { fontSize: 11, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.85)' },
  heroStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.35)' },

  // ── Profile card ───────────────────────────────────────────────────────────
  profileCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: -16,
    borderRadius: 20, padding: 18,
    elevation: 4, shadowColor: '#E75480',
    shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    marginBottom: 16,
  },
  profileCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  profileCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileCardTitle: { fontSize: 15, fontFamily: 'Nunito-ExtraBold', color: '#1A1A1A' },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFE3ED', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, gap: 4,
  },
  rescanBtnText: { fontSize: 12, fontFamily: 'Nunito-Bold', color: '#E75480' },

  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
  profileRowLabel: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#888', width: 80 },

  typeChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 20,
  },
  typeChipText: { fontSize: 13, fontFamily: 'Nunito-ExtraBold' },

  condChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  condChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  condChipText: { fontSize: 12, fontFamily: 'Nunito-SemiBold' },

  profileNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5', marginTop: 4,
  },
  profileNameText: { fontSize: 12, fontFamily: 'Nunito-Regular', color: '#999' },

  // ── How it works banner ────────────────────────────────────────────────────
  howBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 12, gap: 8,
  },
  howBannerText: {
    flex: 1, fontSize: 12, fontFamily: 'Nunito-Regular',
    color: '#5A4590', lineHeight: 18,
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 16, marginBottom: 12, gap: 8,
  },
  sectionIconBg: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { flex: 1, fontSize: 17, fontFamily: 'Nunito-ExtraBold', color: '#1A1A1A' },
  countPill: {
    paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20,
  },
  countText: { fontSize: 12, fontFamily: 'Nunito-Bold' },

  cardsScroll: { paddingHorizontal: 16, paddingBottom: 4 },
  topPicksList: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 14,
  },

  emptySection: {
    alignItems: 'center', paddingVertical: 24,
    marginHorizontal: 16, backgroundColor: '#F9F9F9',
    borderRadius: 16,
  },
  emptySectionText: {
    fontSize: 13, fontFamily: 'Nunito-Regular', color: '#BBB', marginTop: 8,
  },

  // ── Product card ───────────────────────────────────────────────────────────
  card: {
    width: (SCREEN_W - 52) / 2,
    marginRight: 0,
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTop: {
    height: 110, padding: 14,
    justifyContent: 'space-between',
    flexDirection: 'row', alignItems: 'flex-start',
  },
  productImageWrap: {
    width: 64, height: 64, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: { width: 56, height: 56 },
  catBadge: {
    position: 'absolute', bottom: 10, left: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8,
  },
  catBadgeText: { fontSize: 9, fontFamily: 'Nunito-Bold', color: '#fff', letterSpacing: 0.8 },
  matchBadge: {
    backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 2,
    paddingVertical: 4, paddingHorizontal: 8,
    alignItems: 'center',
  },
  matchPct: { fontSize: 15, fontFamily: 'Nunito-ExtraBold' },
  matchLabel: { fontSize: 9, fontFamily: 'Nunito-Regular', color: '#999' },

  cardBody: { padding: 12 },
  cardBrand: {
    fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#E75480', marginBottom: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 13, fontFamily: 'Nunito-Bold', color: '#1A1A1A',
    marginBottom: 8, lineHeight: 18,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  benefitTag: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  benefitTagText: { fontSize: 10, fontFamily: 'Nunito-SemiBold' },
  routineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E75480', borderRadius: 10,
    paddingVertical: 7, marginTop: 8,
  },
  routineBtnText: { fontSize: 11, fontFamily: 'Nunito-Bold', color: '#fff' },

  // ── Disclaimer ─────────────────────────────────────────────────────────────
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, gap: 8,
  },
  disclaimerText: {
    flex: 1, fontSize: 11, fontFamily: 'Nunito-Regular',
    color: '#999', lineHeight: 17,
  },
});

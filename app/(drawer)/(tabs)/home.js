import React, { useState, useRef, useEffect } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signOutUser, getActiveRoutine, markRoutineChecked, getCurrentUserProfile } from '../../../firebase/user';

const { width } = Dimensions.get('window');

const Home = () => {
  const router = useRouter();

  const [showInfo, setShowInfo] = useState(false);
  const [underConstruction, setUnderConstruction] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [routineModal, setRoutineModal] = useState(null); // { product, times }
  const [routineStep, setRoutineStep] = useState('ask'); // 'ask' | 'scan'
  const [profilePhotoURL, setProfilePhotoURL] = useState(null);

  const scrollRef = useRef(null);
  const currentIndex = useRef(0);
  const SIDE_WIDTH = Math.min(280, width * 0.85);
  const sideX = useRef(new Animated.Value(-SIDE_WIDTH)).current;

  const sliderImages = [
    require('../../../assets/images/slider1.jpg'),
    require('../../../assets/images/slider2.jpg'),
    require('../../../assets/images/sliderr1.jpg'),
    require('../../../assets/images/slider4.jpg'),
  ];

  const recommendedProducts = [
    require('../../../assets/images/c1.jpg'),
    require('../../../assets/images/c2.jpg'),
    require('../../../assets/images/c3.jpg'),
    require('../../../assets/images/most1.webp'),
    require('../../../assets/images/most2.webp'),
    require('../../../assets/images/most3.webp'),
    require('../../../assets/images/on1.webp'),
    require('../../../assets/images/on2.jpg'),

  ];

  const tips = [
    { icon: 'sunny-outline', text: 'Use Sunscreen' },
    { icon: 'water-outline', text: 'Stay Hydrated' },
    { icon: 'leaf-outline', text: 'Eat Healthy' },
    { icon: 'star-outline', text: 'Sleep Well' },
  ];

  const openDrawer = () => {
    setSideOpen(true);
    Animated.timing(sideX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };

  const closeSide = () => {
    Animated.timing(sideX, { toValue: -SIDE_WIDTH, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setSideOpen(false);
    });
  };

  const goto = (path) => {
    closeSide();
    router.replace(path);
  };

  // Load profile photo
  useEffect(() => {
    getCurrentUserProfile().then(p => { if (p?.photoURL) setProfilePhotoURL(p.photoURL) }).catch(() => {});
  }, []);

  // Routine check on home mount
  useEffect(() => {
    (async () => {
      try {
        const routine = await getActiveRoutine();
        if (!routine) return;
        const now = new Date();
        const todayStr = now.toDateString();
        // Already checked today?
        if (routine.lastCheckedAt?.seconds) {
          const lastDate = new Date(routine.lastCheckedAt.seconds * 1000);
          if (lastDate.toDateString() === todayStr) return;
        }
        // Has any routine time passed today?
        const dueTimes = (routine.routineTimes || []).filter(t => {
          const [h, m] = t.split(':').map(Number);
          const due = new Date(); due.setHours(h, m, 0, 0);
          return now > due;
        });
        if (dueTimes.length > 0) {
          setRoutineModal(routine);
          setRoutineStep('ask');
        }
      } catch {}
    })();
  }, []);

  // Slider auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % sliderImages.length;
      scrollRef.current?.scrollTo({
        x: currentIndex.current * (width - 32),
        animated: true,
      });
      setActiveSlide(currentIndex.current);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (underConstruction) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.constructionTitle}>Under Construction</Text>
        <Text style={styles.constructionText}>Skin Analysis Feature is coming soon</Text>
        <Text style={styles.detailText}>
          This feature will help you identify your skin type and recommend the right products for healthy glowing skin.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setUnderConstruction(false)}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fmt12 = (t) => {
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const handleRoutineYes = async () => {
    await markRoutineChecked(false).catch(() => {});
    setRoutineStep('scan');
  };

  const handleRoutineNo = async () => {
    await markRoutineChecked(false).catch(() => {});
    setRoutineModal(null);
  };

  const handleScanNow = () => {
    setRoutineModal(null);
    router.push('/skinresult?routineCheck=true');
  };

  const handleSkipScan = () => setRoutineModal(null);

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* ── Routine Check Modal ── */}
      <Modal
        visible={!!routineModal}
        transparent
        animationType="fade"
        onRequestClose={() => setRoutineModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#E75480', '#FF6B9D']} style={styles.modalHeader}>
              <Ionicons name="notifications" size={28} color="#fff" />
              <Text style={styles.modalHeaderTitle}>Daily Routine Check</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              {routineStep === 'ask' ? (
                <>
                  <Text style={styles.modalQuestion}>
                    Did you use{'\n'}
                    <Text style={styles.modalProductName}>
                      {routineModal?.product?.name || 'your skincare product'}
                    </Text>
                    {'\n'}today?
                  </Text>
                  <Text style={styles.modalSub}>
                    Scheduled at{' '}
                    {(routineModal?.routineTimes || []).map(fmt12).join(' & ')}
                  </Text>
                  <View style={styles.modalBtns}>
                    <TouchableOpacity style={styles.modalBtnYes} onPress={handleRoutineYes}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.modalBtnYesText}>Yes, I used it!</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnNo} onPress={handleRoutineNo}>
                      <Text style={styles.modalBtnNoText}>Not yet</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={44} color="#00C896" style={{ alignSelf: 'center', marginBottom: 10 }} />
                  <Text style={styles.modalQuestion}>Great work!</Text>
                  <Text style={styles.modalSub}>
                    Want to scan your skin to track progress? It only takes a moment.
                  </Text>
                  <View style={styles.modalBtns}>
                    <TouchableOpacity style={styles.modalBtnYes} onPress={handleScanNow}>
                      <Ionicons name="scan-outline" size={18} color="#fff" />
                      <Text style={styles.modalBtnYesText}>Scan Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnNo} onPress={handleSkipScan}>
                      <Text style={styles.modalBtnNoText}>Maybe later</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.menuBtn} onPress={openDrawer}>
            <Ionicons name="menu-outline" size={28} color="#E75480" />
          </TouchableOpacity>

          <Image source={require('../../../assets/images/logo3.png')} style={styles.logo} />

          <View style={styles.headerTextContainer}>
            <Text style={styles.heroTitle} numberOfLines={1}>Elevate Your Skin</Text>
            <Text style={styles.heroSub} numberOfLines={1}>with the right routine</Text>
          </View>

          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profile')}>
            {profilePhotoURL ? (
              <Image source={{ uri: profilePhotoURL }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profileBg}>
                <Ionicons name="person-circle-outline" size={30} color="#E75480" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* SLIDER */}
        <View style={styles.sliderContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
              setActiveSlide(index);
              currentIndex.current = index;
            }}
          >
            {sliderImages.map((img, index) => (
              <Image key={index} source={img} style={styles.sliderImage} />
            ))}
          </ScrollView>
          <View style={styles.dotContainer}>
            {sliderImages.map((_, i) => (
              <View key={i} style={[styles.dot, activeSlide === i && styles.activeDot]} />
            ))}
          </View>
        </View>

        {/* SKIN TYPE */}
        <Text style={styles.sectionTitle}>Select Your Skin Type</Text>
        <View style={styles.skinTypeRow}>
          {['oily', 'dry', 'combination'].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.skinCard}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/skinroutine', params: { skinType: type } })}
            >
              <Text style={styles.skinCardText}>{type.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BUTTONS */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowInfo(!showInfo)}>
            <Text style={styles.outlineBtnText}>{showInfo ? 'Close Info' : 'Skin Care Info'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/allproducts')}>
            <Text style={styles.outlineBtnText}>View Products</Text>
          </TouchableOpacity>
        </View>

        {showInfo && (
          <View style={styles.infoBox}>
            <InfoItem title="Cleanser" desc="Removes dirt, oil and makeup. Use twice daily." />
            <InfoItem title="Moisturizer" desc="Hydrates and softens skin. Apply morning and night." />
            <InfoItem title="Sunscreen" desc="Protects from UV rays. Apply every morning." />
            <InfoItem title="Toner" desc="Balances skin pH and tightens pores." />
            <InfoItem title="Serum" desc="Targets acne, dullness or aging." />
            <InfoItem title="AHA / BHA" desc="Use 1–2 times weekly for exfoliation." />
          </View>
        )}

        {/* START BUTTON */}
        <View style={styles.startBtnContainer}>
          <TouchableOpacity style={styles.mainStartBtn} onPress={() => setUnderConstruction(true)}>
            <Text style={styles.mainStartBtnText}>Start Skinalyst</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>

        {/* RECOMMENDED PRODUCTS */}
        <Text style={styles.sectionTitle}>Recommended Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {recommendedProducts.map((img, i) => (
            <View key={i} style={styles.productCard}>
              <Image source={img} style={styles.productImage} />
            </View>
          ))}
        </ScrollView>

        {/* TIPS & TRICKS */}
        <Text style={styles.sectionTitle}>Tips & Tricks</Text>
        <View style={styles.tipsContainer}>
          {tips.map((tip, i) => (
            <View key={i} style={styles.tipCard}>
              <Ionicons name={tip.icon} size={28} color="#E75480" />
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* SIDE SHEET */}
      {sideOpen && <Pressable style={styles.backdrop} onPress={closeSide} />}
      <Animated.View style={[styles.sideSheet, { width: SIDE_WIDTH, transform: [{ translateX: sideX }] }]} pointerEvents={sideOpen ? 'auto' : 'none'}>
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Image source={require('../../../assets/images/logo3.png')} style={{ width: 140, height: 60, resizeMode: 'contain' }} />
        </View>
        {[{ icon: 'home-outline', label: 'Home', path: '/(drawer)/(tabs)/home' },
        { icon: 'analytics-outline', label: 'My Progress', path: '/progress' },
        { icon: 'scan-outline', label: 'Scan', path: '/skinscan' },
        { icon: 'help-buoy-outline', label: 'Support', path: '/support' },
        { icon: 'time-outline', label: 'History', path: '/history' },
        { icon: 'notifications-outline', label: 'Reminders', path: '/reminders' },
        { icon: 'log-out-outline', label: 'Sign Out', path: '/login', signOut: true }].map(item => (
          <TouchableOpacity key={item.label} style={styles.sheetItem} onPress={async () => {
            closeSide();
            if (item.signOut) { try { await signOutUser(); } catch {} router.replace(item.path); }
            else goto(item.path);
          }}>
            <Ionicons name={item.icon} size={22} color="#666" />
            <Text style={styles.sheetLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </SafeAreaView>
  );
};

const InfoItem = ({ title, desc }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.infoTitle}>{title}</Text>
    <Text style={styles.infoDesc}>{desc}</Text>
  </View>
);

const styles = StyleSheet.create({
  // ── Routine Modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 18,
  },
  modalHeaderTitle: { fontSize: 18, fontFamily: 'Nunito-ExtraBold', color: '#fff' },
  modalBody: { padding: 20 },
  modalQuestion: {
    fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: '#1A1A1A',
    textAlign: 'center', lineHeight: 28, marginBottom: 8,
  },
  modalProductName: { color: '#E75480' },
  modalSub: {
    fontSize: 13, fontFamily: 'Nunito-Regular', color: '#888',
    textAlign: 'center', marginBottom: 20,
  },
  modalBtns: { gap: 10 },
  modalBtnYes: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#E75480', borderRadius: 14, paddingVertical: 14,
  },
  modalBtnYesText: { fontSize: 16, fontFamily: 'Nunito-Bold', color: '#fff' },
  modalBtnNo: {
    alignItems: 'center', paddingVertical: 12,
  },
  modalBtnNoText: { fontSize: 15, fontFamily: 'Nunito-SemiBold', color: '#aaa' },

  mainContainer: { flex: 1, backgroundColor: '#FFF1F6' },
  scrollContent: { padding: 16, paddingBottom: 100 },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 6 },
  menuBtn: { padding: 6, marginRight: 6 },
  logo: { width: 60, height: 40, resizeMode: 'contain' },
  headerTextContainer: { flex: 1, minWidth: 0 },
  heroTitle: { fontSize: 20, color: '#000', fontFamily: 'Nunito-ExtraBold' },
  heroSub: { marginLeft: 6, fontSize: 13, color: '#E75480', fontFamily: 'Nunito-SemiBold', letterSpacing: 0.3 },
  profileBtn: { padding: 6, marginLeft: 8 },
  profileBg: { backgroundColor: '#FFE3ED', borderRadius: 25, padding: 3 },
  profilePhoto: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#E75480' },

  sliderContainer: { height: 190, marginTop: 12, width: '100%', borderRadius: 18, overflow: 'hidden', elevation: 2 },
  sliderImage: { width: width - 32, height: 190, resizeMode: 'cover', borderRadius: 18 },
  dotContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD1E1', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#E75480', width: 10, height: 10 },

  sectionTitle: { fontSize: 21, fontFamily: 'Nunito-ExtraBold', marginTop: 22, marginBottom: 12 },

  skinTypeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  skinCard: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 20, width: '31%', alignItems: 'center', borderWidth: 1, borderColor: '#FFD1E1', elevation: 3 },
  skinCardText: { fontSize: 12, color: '#333', fontFamily: 'Nunito-Bold' },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  outlineBtn: { borderWidth: 1.5, borderColor: '#E75480', paddingVertical: 12, borderRadius: 25, width: '48%', alignItems: 'center' },
  outlineBtnText: { color: '#E75480', fontSize: 14, fontFamily: 'Nunito-Bold' },

  infoBox: { backgroundColor: '#fff0f3', padding: 16, borderRadius: 18, marginTop: 15, borderWidth: 1, borderColor: '#FFD1E1' },
  infoTitle: { fontSize: 16, color: '#E75480', fontFamily: 'Nunito-Bold' },
  infoDesc: { fontSize: 14, color: '#555', fontFamily: 'Nunito-Regular' },

  startBtnContainer: { marginTop: 30, alignItems: 'center' },
  mainStartBtn: { backgroundColor: '#E75480', paddingVertical: 16, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 5, width: '90%', justifyContent: 'center', shadowColor: '#E75480', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  mainStartBtnText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito-Bold' },

  productCard: { width: 120, height: 140, borderRadius: 18, marginRight: 12, overflow: 'hidden', elevation: 3, backgroundColor: '#fff' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  tipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',        // allows multiple rows
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  tipCard: {
    width: '48%',             // two cards per row
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12,         // spacing between rows
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    padding: 10,
  },
  tipText: { fontSize: 13, fontFamily: 'Nunito-Bold', textAlign: 'center', marginTop: 6, color: '#333' },

  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FFF1F6' },
  constructionTitle: { fontSize: 28, color: '#E75480', textAlign: 'center', fontFamily: 'Nunito-ExtraBold' },
  constructionText: { fontSize: 18, color: '#E75480', textAlign: 'center', marginTop: 10, fontFamily: 'Nunito-SemiBold' },
  detailText: { fontSize: 16, color: '#333', textAlign: 'center', marginTop: 20, fontFamily: 'Nunito-Regular' },
  backBtn: { marginTop: 30, backgroundColor: '#E75480', padding: 12, borderRadius: 25 },
  backBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito-Bold' },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sideSheet: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: '#fff', borderTopRightRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 10, paddingTop: 10, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14, marginVertical: 4 },
  sheetLabel: { marginLeft: 10, color: '#666', fontFamily: 'Nunito-Bold' }
});

export default Home;

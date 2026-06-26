import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { saveScanResult, saveScanToHistory, saveRoutineProgressScan } from '../firebase/user';
import { API_BASE } from './config';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SkinResult() {
  const router = useRouter();
  const { mode, routineCheck } = useLocalSearchParams();
  const isRoutineCheck = routineCheck === 'true';
  const [imageUri, setImageUri] = useState(null);
  const [skinType, setSkinType] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notSkin, setNotSkin] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [freshScanData, setFreshScanData] = useState(null); // captured once when scan completes
  const spinAnim = useRef(new Animated.Value(0));
  const timerRef = useRef(null);
  const startRef = useRef(0);
  const targetRef = useRef(25000); // ramp to ~95% in ~25s, then wait for completion

  const toRoutineType = (t) => {
    if (t === 'normal') return 'combination';
    if (t === 'oil') return 'oily';
    return t || 'oily';
  };

  useEffect(() => {
    if (isRoutineCheck) return; // show options screen, don't auto-launch
    if (mode === 'camera') pickFromCamera();
    else pickFromGallery();
  }, [mode]);

  useEffect(() => {
    if (loading) {
      const spinLoop = Animated.loop(
        Animated.timing(spinAnim.current, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoop.start();
      setProgress(2);
      startRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startRef.current;
        const t = Math.max(0, Math.min(1, elapsed / targetRef.current));
        const eased = 1 - Math.pow(1 - t, 3);
        const phase1 = Math.floor(eased * 90); // fast ramp 0→90% in first 25s
        setProgress((p) => {
          if (p >= 90) return Math.min(99, p + 0.2); // slow crawl 90→99%, never freezes
          return Math.max(p, phase1);
        });
      }, 350);

      return () => {
        spinLoop.stop();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        spinAnim.current.setValue(0);
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [loading]);
  // Returns the skin type string, or null if not skin / API error
  const classifyWithModel = async (uri, manageLoading = true) => {
    try {
      if (manageLoading) setLoading(true);
      const formData = new FormData();
      formData.append("file", { uri, name: "image.jpg", type: "image/jpeg" });
      const res = await fetch(`${API_BASE}/predict`, { method: "POST", body: formData });
      const json = await res.json();
      if (json.is_skin === false) {
        setNotSkin(true);
        return null;
      }
      if (json && json.type) {
        setSkinType(json.type);
        setConfidence(json.confidence ?? null);
        return json.type;
      }
    } catch {
      setNotSkin(true);
      return null;
    } finally {
      if (manageLoading) setLoading(false);
    }
    return null;
  };

  // Returns the conditions array
  const detectConditions = async (uri) => {
    try {
      const formData = new FormData();
      formData.append("file", { uri, name: "image.jpg", type: "image/jpeg" });
      const res = await fetch(`${API_BASE}/detect`, { method: "POST", body: formData });
      const json = await res.json();
      if (json.is_skin === false || !Array.isArray(json.detections)) {
        setConditions([]);
        return [];
      }
      const mapped = json.detections
        .filter(d => d && d.label)
        .map(d => ({ label: d.label, confidence: Math.max(0, Math.min(1, d.confidence ?? 0)) }));
      const result = mapped.slice(0, 5);
      setConditions(result);
      return result;
    } catch {
      setConditions([]);
      return [];
    }
  };

  const runBoth = async (uri) => {
    setLoading(true);
    setNotSkin(false);
    try {
      const [typeResult, condResult] = await Promise.allSettled([
        classifyWithModel(uri, false),
        detectConditions(uri),
      ]);

      const finalType = typeResult.status === 'fulfilled' ? typeResult.value : null;
      const finalConds = condResult.status === 'fulfilled' ? condResult.value : [];

      // Not skin — stop here, error card will show
      if (!finalType) return;

      // Save last scan to Firebase (always)
      saveScanResult({ skinType: finalType, conditions: finalConds }).catch(e =>
        console.warn('[runBoth] saveScanResult failed:', e)
      );

      // For routine check: await Firebase write first, then enable the button.
      if (isRoutineCheck && finalConds.length > 0) {
        await saveRoutineProgressScan({ skinType: finalType, conditions: finalConds }).catch(e =>
          console.warn('[runBoth] saveRoutineProgressScan failed:', e)
        );
        const captured = { skinType: finalType, conditions: finalConds, savedAt: Date.now() };
        setFreshScanData(JSON.stringify(captured));
      }

      setSaved(false);
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setProgress(100);
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleSaveResult = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      await saveScanToHistory({ skinType, conditions });
      setSaved(true);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return alert('Camera permission is required');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      setImageUri(uri);
      setSkinType(null);
      setConditions([]);
      setNotSkin(false);
      await runBoth(uri);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return alert('Gallery permission is required');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      setImageUri(uri);
      setSkinType(null);
      setConditions([]);
      setNotSkin(false);
      await runBoth(uri);
    }
  };

  const spin = spinAnim.current.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      {/* Floating header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Skin Analysis</Text>
      </View>

      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 40, paddingTop: 10 }}
      >
        {imageUri ? (
          <View style={styles.resultWrapper}>
            <Image source={{ uri: imageUri }} style={styles.preview} />

            <View style={styles.card}>
              {loading ? (
                <View style={styles.loadingWrap}>
                  <View style={styles.spinnerOuter}>
                    <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                    <Ionicons name="scan-outline" size={22} color="#F28BA8" />
                  </View>
                  <Text style={styles.loadingPercent}>{progress}%</Text>
                  <Text style={styles.loadingText}>
                    {progress < 30 ? 'Uploading image...' : progress < 70 ? 'Analyzing skin...' : progress < 90 ? 'Running models...' : 'Almost done...'}
                  </Text>
                  <View style={styles.loaderTrack}>
                    <View style={[styles.loaderFill, { width: (220 * Math.min(progress, 100)) / 100 }]} />
                  </View>
                </View>
              ) : notSkin ? (
                <View style={styles.notSkinWrap}>
                  <Ionicons name="warning-outline" size={48} color="#F28BA8" style={{ marginBottom: 12 }} />
                  <Text style={styles.notSkinTitle}>No Skin Detected</Text>
                  <Text style={styles.notSkinMsg}>
                    This image does not appear to contain skin.{'\n'}
                    Please upload a clear photo of your face or skin area.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultLabel}>Detected Skin Type</Text>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        {(skinType ? (skinType === 'oil' ? 'oily' : skinType) : '...').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {confidence != null && (
                    <View style={styles.confBox}>
                      <Text style={styles.confTitle}>Confidence</Text>
                      <View style={styles.confBar}>
                        <View
                          style={[
                            styles.confBarFill,
                            { width: Math.max(0, Math.min(1, confidence || 0)) * 220 },
                          ]}
                        />
                      </View>
                      <Text style={styles.resultConf}>{(confidence * 100).toFixed(1)}%</Text>
                    </View>
                  )}

                  {conditions.length > 0 && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={styles.confTitle}>Detected Conditions</Text>
                      {conditions.map((c, idx) => (
                        <View key={idx} style={{ marginTop: 8 }}>
                          <View style={styles.conditionsRow}>
                            <Text style={styles.conditionLabel}>{c.label.toUpperCase()}</Text>
                            <Text style={styles.conditionValue}>{(c.confidence * 100).toFixed(0)}%</Text>
                          </View>
                          <View style={styles.confBar}>
                            <View
                              style={[
                                styles.confBarFill,
                                { width: Math.max(0, Math.min(1, c.confidence || 0)) * 220 },
                              ]}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            {!loading && (notSkin ? null : isRoutineCheck ? (
              /* ── Routine progress flow ── */
              <>
                <View style={styles.routineCheckBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#00C896" />
                  <Text style={styles.routineCheckBannerText}>
                    {freshScanData ? 'Scan complete! View your progress comparison below.' : 'Processing scan...'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, !freshScanData && { opacity: 0.6 }]}
                  disabled={!freshScanData}
                  onPress={() => router.replace({
                    pathname: '/(drawer)/progress',
                    params: { freshScan: freshScanData },
                  })}
                >
                  <Text style={styles.primaryText}>View Progress Report</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Normal scan flow ── */
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    const typeForRoutine = toRoutineType(skinType);
                    router.push({ pathname: '/skinroutine', params: { skinType: typeForRoutine } });
                  }}
                >
                  <Text style={styles.primaryText}>View Suggested Routine</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.recsButton}
                  onPress={() =>
                    router.push({
                      pathname: '/(drawer)/(tabs)/recs',
                      params: { skinType, conditions: JSON.stringify(conditions) },
                    })
                  }
                >
                  <Ionicons name="sparkles" size={18} color="#E75480" style={{ marginRight: 8 }} />
                  <Text style={styles.recsButtonText}>Get Product Recommendations</Text>
                </TouchableOpacity>
              </>
            ))}

            {/* Save Result — only after scan completes successfully */}
            {!loading && !notSkin && (
              <TouchableOpacity
                style={[styles.saveButton, saved && styles.saveButtonDone]}
                onPress={handleSaveResult}
                disabled={saved || saving}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={saved ? '#fff' : '#E75480'}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.saveButtonText, saved && styles.saveButtonTextDone]}>
                  {saving ? 'Saving…' : saved ? 'Result Saved' : 'Save Result'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Secondary buttons — always visible so user can cancel/retry */}
            {!loading && (
              <View style={styles.secondaryRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={pickFromCamera}>
                  <Text style={styles.secondaryText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
                  <Text style={styles.secondaryText}>Choose Another</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Text style={styles.instruction}>
              Upload or capture a clear face image for analysis.
            </Text>
            <TouchableOpacity style={[styles.primaryButton, { width: '90%' }]} onPress={pickFromCamera}>
              <Text style={styles.primaryText}>Capture Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, { width: '90%' }]} onPress={pickFromGallery}>
              <Text style={styles.secondaryText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  resultWrapper: {
    width: '100%',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Nunito-ExtraBold',
    marginTop: 12,
  },
  instruction: {
    color: '#AAA',
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  preview: {
    width: '100%',
    height: 270,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#333',
  },
  card: {
    backgroundColor: '#1C1C1C',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(242,139,168,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: { color: '#AAA', fontSize: 13, fontFamily: 'Nunito-Regular' },
  chip: {
    backgroundColor: '#F28BA8',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 25,
    marginLeft: 8,
  },
  chipText: { color: '#000', fontSize: 13, fontFamily: 'Nunito-Bold' },
  confBox: { marginTop: 14 },
  confTitle: { color: '#AAA', fontSize: 12, marginBottom: 6, fontFamily: 'Nunito-SemiBold' },
  confBar: {
    height: 12,
    width: '100%',
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  confBarFill: {
    height: 12,
    backgroundColor: '#F28BA8',
    borderRadius: 6,
  },
  resultConf: { color: '#FFF', fontSize: 12, marginTop: 6, fontFamily: 'Nunito-Regular' },
  conditionLabel: { color: '#B0B0B0', fontSize: 12, fontFamily: 'Nunito-SemiBold' },
  conditionValue: { color: '#fff', fontSize: 12, fontFamily: 'Nunito-Bold' },
  conditionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notSkinWrap: { alignItems: 'center', paddingVertical: 12 },
  notSkinTitle: { color: '#F28BA8', fontSize: 18, fontFamily: 'Nunito-ExtraBold', marginBottom: 10 },
  notSkinMsg: { color: '#AAA', fontSize: 13, fontFamily: 'Nunito-Regular', textAlign: 'center', lineHeight: 20 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loadingWrap: { alignItems: 'center', justifyContent: 'center' },
  loadingPercent: { color: '#F28BA8', fontSize: 22, fontFamily: 'Nunito-ExtraBold', marginTop: 12 },
  loadingText: { color: '#FFF', fontSize: 14, fontFamily: 'Nunito-Bold', marginTop: 4 },
  spinnerOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(242,139,168,0.3)',
    borderTopColor: '#F28BA8',
  },
  loaderTrack: {
    marginTop: 12,
    width: 220,
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  loaderFill: {
    height: 8,
    backgroundColor: '#F28BA8',
    borderRadius: 4,
  },
  routineCheckBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,200,150,0.12)', borderRadius: 10,
    padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.3)',
  },
  routineCheckBannerText: {
    flex: 1, color: '#00C896', fontSize: 13, fontFamily: 'Nunito-SemiBold',
  },
  primaryButton: {
    backgroundColor: '#F28BA8',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
    shadowColor: '#F28BA8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
  recsButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E75480',
    backgroundColor: 'rgba(242,139,168,0.08)',
    marginBottom: 14,
  },
  recsButtonText: {
    color: '#E75480',
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
  },
  saveButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E75480',
    backgroundColor: 'transparent',
    marginBottom: 14,
  },
  saveButtonDone: {
    backgroundColor: '#E75480',
    borderColor: '#E75480',
  },
  saveButtonText: {
    color: '#E75480',
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
  },
  saveButtonTextDone: {
    color: '#fff',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
  },
});

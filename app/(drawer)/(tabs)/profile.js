
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, Alert, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUserProfile, signOutUser, getAllergyProfile, uploadProfileImage } from '../../../firebase/user';
import ScreenHeader from '../../components/ScreenHeader';

function Skeleton({ width, height, borderRadius = 10, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#F2C4D4', opacity }, style]} />
  );
}

export default function Profile() {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState(null);
  const [allergyProfile, setAllergyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile Image Selection Logic
  const pickImage = async () => {
    Alert.alert(
      "Profile Photo",
      "Choose an option",
      [
        { text: "Camera", onPress: () => openCamera() },
        { text: "Gallery", onPress: () => openGallery() },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return alert('Permission denied');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) uploadAndSave(result.assets[0].uri);
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return alert('Permission denied');
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) uploadAndSave(result.assets[0].uri);
  };

  const uploadAndSave = async (uri) => {
    setImage(uri); // show immediately
    setUploadingPhoto(true);
    try {
      await uploadProfileImage(uri);
    } catch {
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [data, allergy] = await Promise.all([
          getCurrentUserProfile().catch(() => null),
          getAllergyProfile().catch(() => null),
        ]);
        setProfile(data);
        setAllergyProfile(allergy);
        if (data?.photoURL) setImage(data.photoURL);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={profile?.name ? `Hi ${profile.name}` : 'My Profile'} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <>
            {/* Avatar skeleton */}
            <View style={styles.imageSection}>
              <Skeleton width={100} height={100} borderRadius={50} />
              <Skeleton width={140} height={14} borderRadius={7} style={{ marginTop: 12 }} />
            </View>

            {/* Card skeletons */}
            <View style={{ width: '90%' }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.cardBox}>
                  <Skeleton width={80} height={12} borderRadius={6} style={{ marginBottom: 10 }} />
                  <Skeleton width="70%" height={16} borderRadius={8} />
                </View>
              ))}
            </View>

            {/* Allergy card skeleton */}
            <Skeleton width="90%" height={90} borderRadius={16} style={{ marginTop: 4 }} />

            {/* Button skeletons */}
            <Skeleton width="85%" height={50} borderRadius={10} style={{ marginTop: 10 }} />
            <Skeleton width="85%" height={50} borderRadius={10} style={{ marginTop: 20 }} />
          </>
        ) : (
          <>
            {/* Profile Image Section */}
            <View style={styles.imageSection}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} disabled={uploadingPhoto}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.avatar} />
                ) : (
                  <View style={styles.placeholderAvatar}>
                    <Ionicons name="person" size={50} color="#ccc" />
                  </View>
                )}
                <View style={styles.camIcon}>
                  {uploadingPhoto
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="camera" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
              <Text style={styles.notLoggedIn}>{profile?.email || 'Guest User'}</Text>
            </View>

            <View style={{ width: '90%' }}>
              <View style={styles.cardBox}>
                <View style={styles.cardRow}>
                  <Ionicons name="person-outline" size={20} color="#E75480" />
                  <Text style={styles.cardLabel}>Name</Text>
                </View>
                <Text style={styles.cardValue}>{profile?.name || '—'}</Text>
              </View>
              <View style={styles.cardBox}>
                <View style={styles.cardRow}>
                  <Ionicons name="mail-outline" size={20} color="#E75480" />
                  <Text style={styles.cardLabel}>Email</Text>
                </View>
                <Text style={styles.cardValue}>{profile?.email || '—'}</Text>
              </View>
              <View style={styles.cardBox}>
                <View style={styles.cardRow}>
                  <Ionicons name="calendar-outline" size={20} color="#E75480" />
                  <Text style={styles.cardLabel}>Age</Text>
                </View>
                <Text style={styles.cardValue}>{profile?.age ?? '—'}</Text>
              </View>
              <View style={styles.cardBox}>
                <View style={styles.cardRow}>
                  <Ionicons name="male-female-outline" size={20} color="#E75480" />
                  <Text style={styles.cardLabel}>Gender</Text>
                </View>
                <Text style={styles.cardValue}>{profile?.gender || '—'}</Text>
              </View>
            </View>

              {/* ── Allergy & Sensitivity Card ── */}
              <View style={styles.allergyCard}>
                <LinearGradient colors={['#E75480', '#FF6B9D']} style={styles.allergyCardHeader}>
                  <Ionicons name="shield-checkmark" size={18} color="#fff" />
                  <Text style={styles.allergyCardTitle}>Allergy & Sensitivity Profile</Text>
                  <TouchableOpacity
                    style={styles.allergyEditBtn}
                    onPress={() => router.push('/allergyprofile?from=profile')}
                  >
                    <Ionicons name="create-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>

                {allergyProfile ? (
                  <View style={styles.allergyCardBody}>
                    {allergyProfile.allergens?.length > 0 && (
                      <View style={styles.allergySection}>
                        <Text style={styles.allergySectionLabel}>Ingredient Allergies</Text>
                        <View style={styles.allergyChipRow}>
                          {allergyProfile.allergens.map(a => (
                            <View key={a} style={styles.allergyChip}>
                              <Ionicons name="close-circle" size={12} color="#E75480" style={{ marginRight: 4 }} />
                              <Text style={styles.allergyChipText}>{a.replace(/_/g, ' ')}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {allergyProfile.sensitivities?.length > 0 && (
                      <View style={styles.allergySection}>
                        <Text style={styles.allergySectionLabel}>Skin Conditions</Text>
                        <View style={styles.allergyChipRow}>
                          {allergyProfile.sensitivities.map(s => (
                            <View key={s} style={[styles.allergyChip, styles.allergyChipSensitivity]}>
                              <Ionicons name="alert-circle" size={12} color="#6D4DF2" style={{ marginRight: 4 }} />
                              <Text style={[styles.allergyChipText, { color: '#6D4DF2' }]}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {allergyProfile.customNotes ? (
                      <View style={styles.allergySection}>
                        <Text style={styles.allergySectionLabel}>Other Notes</Text>
                        <Text style={styles.allergyNotes}>{allergyProfile.customNotes}</Text>
                      </View>
                    ) : null}

                    {!allergyProfile.allergens?.length && !allergyProfile.sensitivities?.length && !allergyProfile.customNotes && (
                      <Text style={styles.allergyEmpty}>No allergies or sensitivities recorded.</Text>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.allergySetupPrompt}
                    onPress={() => router.push('/allergyprofile?from=profile')}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#E75480" />
                    <Text style={styles.allergySetupText}>Set up your allergy profile</Text>
                    <Ionicons name="chevron-forward" size={16} color="#E75480" />
                  </TouchableOpacity>
                )}
              </View>

            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profilesetup')}>
              <Ionicons name="create-outline" size={22} color="#fff" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutBtn} onPress={async () => { try { await signOutUser(); } catch {} router.replace('/login'); }}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F6' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Nunito-ExtraBold' },
  scrollContent: { alignItems: 'center', paddingBottom: 40 },
  imageSection: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  placeholderAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  camIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#E75480', padding: 6, borderRadius: 15 },
  notLoggedIn: { marginTop: 10, color: '#888', fontStyle: 'italic', fontFamily: 'Nunito-Regular' },
  cardBox: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardLabel: { marginLeft: 8, color: '#666', fontFamily: 'Nunito-Regular' },
  cardValue: { color: '#333', fontFamily: 'Nunito-Bold', fontSize: 16 },
  editBtn: { flexDirection: 'row', backgroundColor: '#E75480', marginTop: 10, padding: 15, borderRadius: 10, width: '85%', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#E75480', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  editBtnText: { color: '#fff', marginLeft: 8, fontFamily: 'Nunito-Bold' },
  signOutBtn: { flexDirection: 'row', backgroundColor: '#e21072', marginTop: 20, padding: 15, borderRadius: 10, width: '85%', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#e21072', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  signOutText: { color: '#fff', marginLeft: 10, fontFamily: 'Nunito-Bold' },

  allergyCard: {
    width: '90%', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#E75480', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  allergyCardHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  allergyCardTitle: { flex: 1, fontSize: 14, fontFamily: 'Nunito-Bold', color: '#fff' },
  allergyEditBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  allergyCardBody: { padding: 14, gap: 12 },
  allergySection: { gap: 6 },
  allergySectionLabel: { fontSize: 12, fontFamily: 'Nunito-Bold', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  allergyChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergyChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 14, backgroundColor: '#FFE3ED',
  },
  allergyChipSensitivity: { backgroundColor: '#F3EFFE' },
  allergyChipText: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: '#E75480' },
  allergyNotes: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#555', lineHeight: 18 },
  allergyEmpty: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#bbb', textAlign: 'center', paddingVertical: 8 },
  allergySetupPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 16,
  },
  allergySetupText: { flex: 1, fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#E75480' },
});

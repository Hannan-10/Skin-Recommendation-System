
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUserProfile, signOutUser } from '../../../firebase/user';
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
  const [profile, setProfile] = useState(null);
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
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const openGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getCurrentUserProfile();
        setProfile(data);
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

            {/* Button skeletons */}
            <Skeleton width="85%" height={50} borderRadius={10} style={{ marginTop: 10 }} />
            <Skeleton width="85%" height={50} borderRadius={10} style={{ marginTop: 20 }} />
          </>
        ) : (
          <>
            {/* Profile Image Section */}
            <View style={styles.imageSection}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.avatar} />
                ) : (
                  <View style={styles.placeholderAvatar}>
                    <Ionicons name="person" size={50} color="#ccc" />
                  </View>
                )}
                <View style={styles.camIcon}>
                  <Ionicons name="camera" size={16} color="#fff" />
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
  signOutText: { color: '#fff', marginLeft: 10, fontFamily: 'Nunito-Bold' }
});

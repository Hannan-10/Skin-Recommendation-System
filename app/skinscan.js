import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SkinScan() {
  const router = useRouter();

  /**
   * ✅ ALWAYS GO HOME
   * This ignores navigation history completely
   */
  const handleBack = () => {
    router.replace('/home'); // <-- FORCE HOME
  };

  /**
   * Camera Mode
   */
  const handleCapture = () => {
    router.push({
      pathname: '/skinresult',
      params: { mode: 'camera' },
    });
  };

  /**
   * Gallery Mode
   */
  const handleUpload = () => {
    router.push({
      pathname: '/skinresult',
      params: { mode: 'gallery' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="#F28BA8" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Skin Analysis</Text>

        <View style={{ width: 28 }} />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <View style={styles.scanFrame}>
          <Text style={styles.title}>Face Scan</Text>

          <Text style={styles.instruction}>
            Upload or capture a clear face image for analysis.
          </Text>
        </View>

        {/* Capture */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCapture}
        >
          <Ionicons
            name="camera"
            size={20}
            color="#000"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryText}>Capture Image</Text>
        </TouchableOpacity>

        {/* Upload */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleUpload}
        >
          <Ionicons
            name="images"
            size={20}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.secondaryText}>
            Upload from Gallery
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginTop: 10,
  },

  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
  },

  backButton: { padding: 5 },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  scanFrame: {
    width: 280,
    height: 350,
    borderWidth: 2,
    borderColor: '#F28BA8',
    borderRadius: 30,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 50,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    marginBottom: 10,
    fontFamily: 'Nunito-ExtraBold',
  },

  instruction: {
    color: '#EDEDED',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Nunito-Regular',
  },

  primaryButton: {
    width: '100%',
    backgroundColor: '#F28BA8',
    paddingVertical: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 6,
  },

  primaryText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },

  secondaryButton: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },

  secondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
});
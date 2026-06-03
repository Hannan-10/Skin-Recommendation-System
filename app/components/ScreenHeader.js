import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export default function ScreenHeader({ title, onBack }) {
  const router = useRouter()
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={() => (onBack ? onBack() : router.back())} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 22 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 12, shadowColor: '#E75480', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  headerTitle: { fontSize: 20, color: '#333', fontFamily: 'Nunito-ExtraBold' },
})

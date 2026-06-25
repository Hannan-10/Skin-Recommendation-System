import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'

const OVERPASS_URL = process.env.EXPO_PUBLIC_OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter'
const SEARCH_RADIUS_M = 10000 // 10 km

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildQuery(lat, lon) {
  const r = SEARCH_RADIUS_M
  return (
    `[out:json][timeout:30];` +
    `(` +
    `node["healthcare:speciality"="dermatology"](around:${r},${lat},${lon});` +
    `node["speciality"="dermatology"](around:${r},${lat},${lon});` +
    `node["amenity"="doctors"](around:${r},${lat},${lon});` +
    `node["amenity"="clinic"](around:${r},${lat},${lon});` +
    `node["healthcare"="doctor"](around:${r},${lat},${lon});` +
    `way["healthcare"="doctor"](around:${r},${lat},${lon});` +
    `);` +
    `out center body;`
  )
}

function fmtDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export default function Dermatologists() {
  const router = useRouter()
  const [phase, setPhase] = useState('locating') // locating | fetching | done | error
  const [userLoc, setUserLoc] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setPhase('locating')
    setErrorMsg('')
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please enable it in your device settings.')
        setPhase('error')
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = loc.coords
      setUserLoc({ latitude, longitude })

      setPhase('fetching')
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: buildQuery(latitude, longitude),
        headers: { 'Content-Type': 'text/plain' },
      })
      if (!res.ok) throw new Error('Overpass API error')
      const json = await res.json()

      const seen = new Set()
      const results = (json.elements || [])
        .map(el => {
          const lat = el.lat ?? el.center?.lat
          const lon = el.lon ?? el.center?.lon
          if (!lat || !lon || !el.tags?.name) return null
          if (seen.has(el.tags.name)) return null
          seen.add(el.tags.name)
          const addressParts = [
            el.tags['addr:street'],
            el.tags['addr:housenumber'],
            el.tags['addr:city'],
          ].filter(Boolean)
          return {
            id: el.id,
            name: el.tags.name,
            address: addressParts.length ? addressParts.join(', ') : (el.tags['addr:full'] || ''),
            phone: el.tags.phone || el.tags['contact:phone'] || '',
            speciality: el.tags['healthcare:speciality'] || el.tags.speciality || '',
            website: el.tags.website || el.tags['contact:website'] || '',
            lat,
            lon,
            distance: haversineKm(latitude, longitude, lat, lon),
          }
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 25)

      setDoctors(results)
      setPhase('done')
    } catch {
      setErrorMsg('Could not load results. Please check your internet connection and try again.')
      setPhase('error')
    }
  }

  const openMaps = (lat, lon, name) => {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' dermatologist')}&center=${lat},${lon}`
    )
  }

  const openGoogleSearch = () => {
    if (!userLoc) return
    Linking.openURL(
      `https://www.google.com/maps/search/dermatologist/@${userLoc.latitude},${userLoc.longitude},14z`
    )
  }

  const renderItem = ({ item }) => {
    const isDerm = item.speciality?.toLowerCase().includes('dermatol')
    const leftIcon = isDerm ? 'body-outline' : item.speciality ? 'ribbon-outline' : 'medkit-outline'

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {/* Left icon — changes based on speciality */}
          <View style={styles.cardIconWrap}>
            <Ionicons name={leftIcon} size={20} color="#E75480" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>

            {/* Speciality row with icon */}
            {!!item.speciality && (
              <View style={styles.cardRow}>
                <Ionicons name="ribbon-outline" size={12} color="#6D4DF2" style={{ marginRight: 4 }} />
                <Text style={styles.cardSpeciality}>
                  {item.speciality.charAt(0).toUpperCase() + item.speciality.slice(1)}
                </Text>
              </View>
            )}

            {/* Address row */}
            {!!item.address && (
              <View style={styles.cardRow}>
                <Ionicons name="location-outline" size={12} color="#aaa" style={{ marginRight: 4 }} />
                <Text style={styles.cardAddress} numberOfLines={2}>{item.address}</Text>
              </View>
            )}

            {/* Phone row */}
            {!!item.phone && (
              <TouchableOpacity style={styles.cardRow} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                <Ionicons name="call-outline" size={12} color="#E75480" style={{ marginRight: 4 }} />
                <Text style={styles.cardPhone}>{item.phone}</Text>
              </TouchableOpacity>
            )}

            {/* Distance row with icon */}
            <View style={styles.cardRow}>
              <Ionicons name="navigate-outline" size={12} color="#00C896" style={{ marginRight: 4 }} />
              <Text style={styles.cardDistance}>{fmtDistance(item.distance)} away</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.mapsBtn} onPress={() => openMaps(item.lat, item.lon, item.name)}>
          <Ionicons name="navigate-outline" size={14} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.mapsBtnText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#E75480', '#FF6B9D']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Nearby Dermatologists</Text>
          <Text style={styles.headerSub}>Clinics & doctors within 10 km of you</Text>
        </View>
        <Ionicons name="medkit-outline" size={26} color="rgba(255,255,255,0.8)" />
      </LinearGradient>

      {(phase === 'locating' || phase === 'fetching') && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#E75480" style={{ marginBottom: 16 }} />
          <Text style={styles.statusText}>
            {phase === 'locating' ? 'Getting your location…' : 'Searching nearby clinics…'}
          </Text>
          <Text style={styles.statusSub}>
            {phase === 'locating'
              ? 'Please allow location access when prompted'
              : 'Querying OpenStreetMap data'}
          </Text>
        </View>
      )}

      {phase === 'error' && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={56} color="#ddd" />
          <Text style={styles.errorTitle}>Could Not Load</Text>
          <Text style={styles.errorSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'done' && doctors.length === 0 && (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={56} color="#ddd" />
          <Text style={styles.errorTitle}>None Found Nearby</Text>
          <Text style={styles.errorSub}>
            No dermatologists found within 10 km in OpenStreetMap data. Try searching Google Maps directly.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={openGoogleSearch}>
            <Ionicons name="map-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>Search on Google Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'done' && doctors.length > 0 && (
        <FlatList
          data={doctors}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Ionicons name="checkmark-circle" size={16} color="#00C896" />
              <Text style={styles.listHeaderText}>
                {doctors.length} location{doctors.length > 1 ? 's' : ''} found near you
              </Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.googleFallback} onPress={openGoogleSearch}>
              <Ionicons name="logo-google" size={16} color="#E75480" style={{ marginRight: 8 }} />
              <Text style={styles.googleFallbackText}>Search more on Google Maps</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F6' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Nunito-ExtraBold', color: '#fff' },
  headerSub: { fontSize: 12, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  statusText: { fontSize: 16, fontFamily: 'Nunito-Bold', color: '#333', marginBottom: 6, textAlign: 'center' },
  statusSub: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#888', textAlign: 'center' },
  errorTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: '#333', marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13, fontFamily: 'Nunito-Regular', color: '#888', textAlign: 'center', lineHeight: 19, marginBottom: 20 },

  retryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E75480', paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 14, elevation: 3,
  },
  retryBtnText: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#fff' },

  list: { padding: 16, paddingBottom: 40 },
  listHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 14,
  },
  listHeaderText: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#00C896' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    elevation: 2, shadowColor: '#E75480', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardTop: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFE3ED',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardName: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#1A1A1A', marginBottom: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  cardSpeciality: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#6D4DF2', flexShrink: 1 },
  cardAddress: { flex: 1, fontSize: 11, fontFamily: 'Nunito-Regular', color: '#888', lineHeight: 15 },
  cardPhone: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: '#E75480' },
  cardDistance: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: '#00C896' },

  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E75480', paddingVertical: 10, borderRadius: 10,
  },
  mapsBtnText: { fontSize: 13, fontFamily: 'Nunito-Bold', color: '#fff' },

  googleFallback: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFE3ED', borderRadius: 14,
    paddingVertical: 14, marginTop: 4,
    backgroundColor: '#fff',
  },
  googleFallbackText: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#E75480' },
})

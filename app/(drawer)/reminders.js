import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, Alert, TextInput,
} from 'react-native'
import ScreenHeader from '../components/ScreenHeader'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import StatusModal from '../components/StatusModal'
import { getActiveRoutine, updateActiveRoutineTimes } from '../../firebase/user'

// Show notification banner even when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const CUSTOM_KEY = 'skinalyst_custom_reminders'

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseTime(str) {
  const [h, m] = (str || '08:00').split(':').map(Number)
  return { hour: h, minute: m }
}

function fmt(str) {
  const { hour, minute } = parseTime(str)
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`
}

function toTimeStr(hour24, minute) {
  return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

function isDay(str) {
  return parseTime(str).hour < 18
}

async function scheduleDaily(product, timeStr) {
  const { hour, minute } = parseTime(timeStr)
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '✨ Skinalyst Reminder',
      body: `Time to apply your ${product}!`,
      sound: true,
    },
    trigger: { hour, minute, repeats: true },
  })
}

async function cancelNotif(id) {
  if (!id) return
  try { await Notifications.cancelScheduledNotificationAsync(id) } catch {}
}

// ── Time Picker Modal ─────────────────────────────────────────────────────────
function TimePickerModal({ visible, hour, minute, amPm, onChangeHour, onChangeMinute, onChangeAmPm, onCancel, onSave, saveLabel = 'Save' }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select Time</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
            <View style={{ width: 85 }}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <Picker selectedValue={hour} onValueChange={onChangeHour} itemStyle={styles.pickerItem}>
                {[...Array(12)].map((_, i) => <Picker.Item key={i + 1} label={`${i + 1}`} value={i + 1} />)}
              </Picker>
            </View>
            <View style={{ width: 85, marginHorizontal: 6 }}>
              <Text style={styles.pickerLabel}>Minute</Text>
              <Picker selectedValue={minute} onValueChange={onChangeMinute} itemStyle={styles.pickerItem}>
                {[...Array(60)].map((_, i) => <Picker.Item key={i} label={i.toString().padStart(2, '0')} value={i} />)}
              </Picker>
            </View>
            <View style={{ width: 85 }}>
              <Text style={styles.pickerLabel}>AM / PM</Text>
              <Picker selectedValue={amPm} onValueChange={onChangeAmPm} itemStyle={styles.pickerItem}>
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtn} onPress={onCancel}>
              <Text style={styles.modalBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={onSave}>
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>{saveLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function Reminders() {
  const router = useRouter()

  const [routine, setRoutine] = useState(null)
  const [routineNotifIds, setRoutineNotifIds] = useState({})
  const [customs, setCustoms] = useState([])
  const [loading, setLoading] = useState(true)

  // Add-reminder form state
  const [newType, setNewType] = useState(null)
  const [newProduct, setNewProduct] = useState('')
  const [addHour, setAddHour] = useState(8)
  const [addMinute, setAddMinute] = useState(0)
  const [addAmPm, setAddAmPm] = useState('AM')
  const [showAddModal, setShowAddModal] = useState(false)

  // Change-time state
  const [changeTarget, setChangeTarget] = useState(null)
  const [changeHour, setChangeHour] = useState(8)
  const [changeMinute, setChangeMinute] = useState(0)
  const [changeAmPm, setChangeAmPm] = useState('AM')
  const [showChangeModal, setShowChangeModal] = useState(false)

  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' })

  // ── Load on mount ───────────────────────────────────────────────────────────
  useEffect(() => {
    Notifications.requestPermissionsAsync()
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [activeRoutine, stored] = await Promise.all([
        getActiveRoutine().catch(() => null),
        AsyncStorage.getItem(CUSTOM_KEY).catch(() => null),
      ])
      setRoutine(activeRoutine)

      // Ensure notifications exist for each routine time
      const ids = {}
      if (activeRoutine?.routineTimes) {
        for (const t of activeRoutine.routineTimes) {
          const savedId = await AsyncStorage.getItem(`notif_r_${t}`).catch(() => null)
          if (savedId) {
            ids[t] = savedId
          } else {
            const newId = await scheduleDaily(activeRoutine.product?.name || 'skincare product', t).catch(() => null)
            if (newId) {
              ids[t] = newId
              await AsyncStorage.setItem(`notif_r_${t}`, newId).catch(() => {})
            }
          }
        }
      }
      setRoutineNotifIds(ids)
      setCustoms(stored ? JSON.parse(stored) : [])
    } finally {
      setLoading(false)
    }
  }

  const saveCustoms = useCallback(async (list) => {
    setCustoms(list)
    await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(list)).catch(() => {})
  }, [])

  // ── Add custom reminder ─────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newType || !newProduct.trim()) return
    const hr24 = addAmPm === 'PM' ? (addHour % 12) + 12 : addHour % 12
    const timeStr = toTimeStr(hr24, addMinute)
    const notifId = await scheduleDaily(newProduct.trim(), timeStr).catch(() => null)
    const item = { id: String(Date.now()), type: newType, product: newProduct.trim(), time: timeStr, notifId }
    await saveCustoms([...customs, item])
    setNewType(null); setNewProduct(''); setAddHour(8); setAddMinute(0); setAddAmPm('AM')
    setStatusModal({ visible: true, type: 'success', title: 'Reminder Set!', message: `You'll be notified at ${fmt(timeStr)} every day.` })
  }

  // ── Delete custom reminder ──────────────────────────────────────────────────
  const handleDelete = (item) => {
    Alert.alert('Remove Reminder', `Delete reminder for "${item.product}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await cancelNotif(item.notifId)
        await saveCustoms(customs.filter(c => c.id !== item.id))
      }},
    ])
  }

  // ── Open change modal ───────────────────────────────────────────────────────
  const openChange = (kind, item) => {
    const { hour, minute } = parseTime(item.time)
    setChangeTarget({ kind, ...item })
    setChangeHour(hour % 12 || 12)
    setChangeMinute(minute)
    setChangeAmPm(hour >= 12 ? 'PM' : 'AM')
    setShowChangeModal(true)
  }

  // ── Save changed time ───────────────────────────────────────────────────────
  const handleSaveChange = async () => {
    const hr24 = changeAmPm === 'PM' ? (changeHour % 12) + 12 : changeHour % 12
    const newTime = toTimeStr(hr24, changeMinute)
    setShowChangeModal(false)

    if (changeTarget.kind === 'routine') {
      const oldTime = changeTarget.time
      await cancelNotif(routineNotifIds[oldTime])
      await AsyncStorage.removeItem(`notif_r_${oldTime}`).catch(() => {})

      const newTimes = (routine.routineTimes || []).map(t => t === oldTime ? newTime : t)
      await updateActiveRoutineTimes(newTimes)

      const newId = await scheduleDaily(routine.product?.name || 'skincare product', newTime).catch(() => null)
      if (newId) await AsyncStorage.setItem(`notif_r_${newTime}`, newId).catch(() => {})

      setRoutine(r => ({ ...r, routineTimes: newTimes }))
      setRoutineNotifIds(ids => {
        const next = { ...ids }; delete next[oldTime]; if (newId) next[newTime] = newId; return next
      })
    } else {
      await cancelNotif(changeTarget.notifId)
      const newId = await scheduleDaily(changeTarget.product, newTime).catch(() => null)
      await saveCustoms(customs.map(c => c.id === changeTarget.id ? { ...c, time: newTime, notifId: newId } : c))
    }

    setStatusModal({ visible: true, type: 'success', title: 'Reminder Updated', message: `Notification rescheduled to ${fmt(newTime)} daily.` })
  }

  // ── Render a single reminder row ────────────────────────────────────────────
  const renderItem = (item, kind) => {
    const day = isDay(item.time)
    return (
      <View key={`${kind}_${item.id || item.time}`} style={styles.reminderItem}>
        <View style={[styles.typeBadge, day ? styles.dayBadge : styles.nightBadge]}>
          <Ionicons name={day ? 'sunny-outline' : 'moon-outline'} size={14} color={day ? '#E75480' : '#6C63FF'} />
        </View>
        <View style={styles.reminderTextWrapper}>
          <Text style={styles.remTitle} numberOfLines={1}>{item.product}</Text>
          <Text style={styles.remSub}>{fmt(item.time)} · every day</Text>
          {kind === 'routine' && (
            <Text style={styles.remBadge}>Routine</Text>
          )}
        </View>
        <TouchableOpacity style={styles.changeBtn} onPress={() => openChange(kind, item)}>
          <Text style={styles.changeBtnText}>Change</Text>
        </TouchableOpacity>
        {kind === 'custom' && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={15} color="#E75480" />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // ── Build lists ─────────────────────────────────────────────────────────────
  const routineItems = (routine?.routineTimes || []).map(t => ({
    id: `r_${t}`,
    time: t,
    product: routine?.product?.name || 'Routine Product',
    type: isDay(t) ? 'Day' : 'Night',
  }))

  const dayItems   = [...routineItems.filter(r => r.type === 'Day'),   ...customs.filter(c => c.type === 'Day')]
  const nightItems = [...routineItems.filter(r => r.type === 'Night'), ...customs.filter(c => c.type === 'Night')]

  const addTimeStr = toTimeStr(addAmPm === 'PM' ? (addHour % 12) + 12 : addHour % 12, addMinute)

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.headerRow}>
        <ScreenHeader title="Reminders" onBack={() => router.replace('/(drawer)/(tabs)/home')} />
      </View>

      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <ActivityIndicator size="large" color="#E75480" />
          <Text style={styles.loadingText}>Loading reminders…</Text>
        </View>
      ) : (
        <>
          {/* Active routine banner */}
          <View style={[styles.banner, routine?.product ? styles.bannerGreen : styles.bannerPink]}>
            <Ionicons
              name={routine?.product ? 'checkmark-circle' : 'information-circle-outline'}
              size={20}
              color={routine?.product ? '#00C896' : '#E75480'}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              {routine?.product ? (
                <>
                  <Text style={styles.bannerTitle}>Active Routine</Text>
                  <Text style={styles.bannerSub} numberOfLines={1}>
                    {routine.product.name}{routine.product.brand ? ` · ${routine.product.brand}` : ''}
                  </Text>
                </>
              ) : (
                <Text style={styles.bannerSub}>
                  No active routine. Start one from Product Recommendations.
                </Text>
              )}
            </View>
          </View>

          {/* ── Add Custom Reminder ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Custom Reminder</Text>
            <Text style={styles.cardSub}>Choose routine type, time, and product</Text>

            <View style={styles.typeRow}>
              {['Day', 'Night'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, newType === t && (t === 'Day' ? styles.dayActive : styles.nightActive)]}
                  onPress={() => setNewType(t)}
                >
                  <Ionicons name={t === 'Day' ? 'sunny-outline' : 'moon-outline'} size={14}
                    color={newType === t ? (t === 'Day' ? '#E75480' : '#6C63FF') : '#aaa'}
                    style={{ marginRight: 4 }} />
                  <Text style={[styles.typeText, newType === t && (t === 'Day' ? styles.dayActiveText : styles.nightActiveText)]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {newType && (
              <>
                <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowAddModal(true)}>
                  <Ionicons name="time-outline" size={16} color="#E75480" style={{ marginRight: 6 }} />
                  <Text style={styles.timePickerBtnText}>{fmt(addTimeStr)}</Text>
                </TouchableOpacity>

                <View style={styles.inputRow}>
                  <Ionicons name="cube-outline" size={18} color="#E75480" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Product name (e.g. Cleanser)"
                    placeholderTextColor="#bbb"
                    value={newProduct}
                    onChangeText={setNewProduct}
                  />
                </View>
              </>
            )}

            {newType && newProduct.trim().length > 0 && (
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Ionicons name="alarm-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addBtnText}>Add Reminder</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Day Reminders ── */}
          <View style={styles.listSection}>
            <View style={styles.sectionRow}>
              <Ionicons name="sunny" size={18} color="#E75480" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Day Reminders</Text>
            </View>
            {dayItems.length === 0
              ? <Text style={styles.emptyText}>No day reminders set.</Text>
              : dayItems.map(item => renderItem(item, item.id?.startsWith('r_') ? 'routine' : 'custom'))
            }
          </View>

          {/* ── Night Reminders ── */}
          <View style={styles.listSection}>
            <View style={styles.sectionRow}>
              <Ionicons name="moon" size={18} color="#6C63FF" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: '#6C63FF' }]}>Night Reminders</Text>
            </View>
            {nightItems.length === 0
              ? <Text style={styles.emptyText}>No night reminders set.</Text>
              : nightItems.map(item => renderItem(item, item.id?.startsWith('r_') ? 'routine' : 'custom'))
            }
          </View>
        </>
      )}

      {/* Add time picker */}
      <TimePickerModal
        visible={showAddModal}
        hour={addHour} minute={addMinute} amPm={addAmPm}
        onChangeHour={setAddHour} onChangeMinute={setAddMinute} onChangeAmPm={setAddAmPm}
        onCancel={() => setShowAddModal(false)}
        onSave={() => setShowAddModal(false)}
      />

      {/* Change time picker */}
      <TimePickerModal
        visible={showChangeModal}
        hour={changeHour} minute={changeMinute} amPm={changeAmPm}
        onChangeHour={setChangeHour} onChangeMinute={setChangeMinute} onChangeAmPm={setChangeAmPm}
        onCancel={() => setShowChangeModal(false)}
        onSave={handleSaveChange}
        saveLabel="Update"
      />

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        primaryLabel="OK"
        onPrimary={() => setStatusModal(s => ({ ...s, visible: false }))}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8', marginTop: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#aaa', fontFamily: 'Nunito-Regular', fontSize: 14 },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 14, borderWidth: 1,
  },
  bannerGreen: { backgroundColor: '#E6FBF4', borderColor: '#00C896' },
  bannerPink:  { backgroundColor: '#FFF0F5', borderColor: '#FFD1E1' },
  bannerTitle: { fontFamily: 'Nunito-Bold', color: '#00916E', fontSize: 13 },
  bannerSub:   { fontFamily: 'Nunito-Regular', color: '#555', fontSize: 12, marginTop: 2 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, padding: 20, elevation: 5,
    shadowColor: '#E75480', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  cardTitle: { fontSize: 17, color: '#330033', fontFamily: 'Nunito-ExtraBold' },
  cardSub: { fontSize: 13, color: '#777', marginTop: 4, fontFamily: 'Nunito-Regular' },

  typeRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 1, borderColor: '#FFD1E1', backgroundColor: '#fff',
  },
  dayActive:   { backgroundColor: '#FFE3ED', borderColor: '#E75480' },
  nightActive: { backgroundColor: '#E8E7FF', borderColor: '#6C63FF' },
  typeText:         { fontFamily: 'Nunito-SemiBold', color: '#aaa' },
  dayTypeTextActive: { color: '#E75480' },
  nightTypeTextActive: { color: '#6C63FF' },
  dayActiveText:   { color: '#E75480' },
  nightActiveText: { color: '#6C63FF' },

  timePickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 14, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#FFF0F5', borderWidth: 1, borderColor: '#E75480',
  },
  timePickerBtnText: { color: '#E75480', fontFamily: 'Nunito-Bold', fontSize: 15 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14,
    borderWidth: 1, borderColor: '#FDEEF4', borderRadius: 14,
    paddingHorizontal: 14, height: 50, backgroundColor: '#fff',
  },
  textInput: { flex: 1, fontSize: 15, color: '#333', fontFamily: 'Nunito-Regular' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 16, backgroundColor: '#E75480', paddingVertical: 14, borderRadius: 16,
  },
  addBtnText: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15 },

  listSection: { paddingHorizontal: 16, marginTop: 28 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: '#E75480' },
  emptyText: { color: '#ccc', fontFamily: 'Nunito-Regular', fontSize: 13 },

  reminderItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 14, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  typeBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayBadge:   { backgroundColor: '#FFE3ED' },
  nightBadge: { backgroundColor: '#E8E7FF' },
  reminderTextWrapper: { flex: 1, marginLeft: 12 },
  remTitle: { fontFamily: 'Nunito-Bold', color: '#330033', fontSize: 14 },
  remSub:   { fontFamily: 'Nunito-Regular', color: '#777', fontSize: 12, marginTop: 2 },
  remBadge: {
    alignSelf: 'flex-start', marginTop: 3,
    fontSize: 10, fontFamily: 'Nunito-Bold', color: '#00916E',
    backgroundColor: '#E6FBF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  changeBtn: {
    backgroundColor: '#FFF0F5', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#FFD1E1',
  },
  changeBtnText: { color: '#E75480', fontFamily: 'Nunito-Bold', fontSize: 12 },
  deleteBtn: {
    marginLeft: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFF0F5', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FFD1E1',
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '88%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontFamily: 'Nunito-ExtraBold', color: '#330033', fontSize: 16, marginBottom: 4 },
  pickerLabel: { fontFamily: 'Nunito-SemiBold', color: '#330033', marginBottom: 3, fontSize: 13 },
  pickerItem: { color: '#330033', fontSize: 20, height: 160 },
  modalActions: { marginTop: 16, flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#FFD1E1',
  },
  modalBtnPrimary: { backgroundColor: '#E75480', borderColor: '#E75480' },
  modalBtnText: { fontFamily: 'Nunito-Bold', color: '#E75480', fontSize: 14 },
})

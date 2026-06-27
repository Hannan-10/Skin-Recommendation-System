import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, TextInput, Platform,
} from 'react-native'
import ScreenHeader from '../components/ScreenHeader'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import StatusModal from '../components/StatusModal'
import { getActiveRoutine, updateActiveRoutineTimes } from '../../firebase/user'


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

const CHANNEL_ID = 'skinalyst-reminders'

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Skinalyst Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E75480',
    sound: 'default',
  })
}

async function scheduleDaily(product, timeStr) {
  await ensureAndroidChannel()
  const { hour, minute } = parseTime(timeStr)
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '✨ Skinalyst Reminder',
      body: `Time to apply your ${product}!`,
      sound: true,
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
}


async function cancelNotif(id) {
  if (!id) return
  try { await Notifications.cancelScheduledNotificationAsync(id) } catch {}
}

// ── Time-Picker Modal (reused for Add + Change) ───────────────────────────────
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

  const [hasPermission, setHasPermission] = useState(false)
  const [showPermModal, setShowPermModal] = useState(false)

  const [routine, setRoutine] = useState(null)
  const [routineNotifIds, setRoutineNotifIds] = useState({})
  const [customs, setCustoms] = useState([])
  const [loading, setLoading] = useState(true)

  // Add form
  const [newType, setNewType] = useState(null)
  const [newProduct, setNewProduct] = useState('')
  const [addHour, setAddHour] = useState(8)
  const [addMinute, setAddMinute] = useState(0)
  const [addAmPm, setAddAmPm] = useState('AM')
  const [showAddModal, setShowAddModal] = useState(false)

  // Change modal
  const [changeTarget, setChangeTarget] = useState(null)
  const [changeHour, setChangeHour] = useState(8)
  const [changeMinute, setChangeMinute] = useState(0)
  const [changeAmPm, setChangeAmPm] = useState('AM')
  const [showChangeModal, setShowChangeModal] = useState(false)

  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' })
  const [deleteModal, setDeleteModal] = useState({ visible: false, item: null })

  // ── On mount: check permissions first, then load data ──────────────────────
  useEffect(() => {
    (async () => {
      await ensureAndroidChannel()
      const { status } = await Notifications.getPermissionsAsync()
      if (status === 'granted') {
        setHasPermission(true)
      } else {
        setShowPermModal(true)
      }
      await loadAll()
    })()
  }, [])

  // ── User tapped "Enable" on our custom modal ────────────────────────────────
  const handleEnableNotifications = async () => {
    setShowPermModal(false)
    const { status } = await Notifications.requestPermissionsAsync()
    setHasPermission(status === 'granted')
  }

  // ── User tapped "Not Yet" ───────────────────────────────────────────────────
  const handleNotYet = () => {
    setShowPermModal(false)   // modal closes immediately, no OS dialog shown
  }

  // ── Load routine from Firebase + custom from AsyncStorage ──────────────────
  const loadAll = async () => {
    setLoading(true)
    try {
      const [activeRoutine, stored] = await Promise.all([
        getActiveRoutine().catch(() => null),
        AsyncStorage.getItem(CUSTOM_KEY).catch(() => null),
      ])
      setRoutine(activeRoutine)

      const ids = {}
      if (activeRoutine?.routineTimes) {
        for (const t of activeRoutine.routineTimes) {
          const savedId = await AsyncStorage.getItem(`notif_r_${t}`).catch(() => null)
          if (savedId) {
            ids[t] = savedId
          } else {
            // Only schedule if we already have permission
            const { status } = await Notifications.getPermissionsAsync()
            if (status === 'granted') {
              const newId = await scheduleDaily(activeRoutine.product?.name || 'skincare product', t).catch(() => null)
              if (newId) {
                ids[t] = newId
                await AsyncStorage.setItem(`notif_r_${t}`, newId).catch(() => {})
              }
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
    let notifId = null
    if (hasPermission) {
      notifId = await scheduleDaily(newProduct.trim(), timeStr).catch(() => null)
    }
    const item = { id: String(Date.now()), type: newType, product: newProduct.trim(), time: timeStr, notifId }
    await saveCustoms([...customs, item])
    setNewType(null); setNewProduct(''); setAddHour(8); setAddMinute(0); setAddAmPm('AM')
    setStatusModal({ visible: true, type: 'success', title: 'Reminder Set!', message: `You'll be reminded at ${fmt(timeStr)} every day.` })
  }

  // ── Delete custom reminder ──────────────────────────────────────────────────
  const handleDelete = (item) => {
    setDeleteModal({ visible: true, item })
  }

  const confirmDelete = async () => {
    const item = deleteModal.item
    setDeleteModal({ visible: false, item: null })
    await cancelNotif(item.notifId)
    await saveCustoms(customs.filter(c => c.id !== item.id))
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

      let newId = null
      if (hasPermission) {
        newId = await scheduleDaily(routine.product?.name || 'skincare product', newTime).catch(() => null)
        if (newId) await AsyncStorage.setItem(`notif_r_${newTime}`, newId).catch(() => {})
      }

      setRoutine(r => ({ ...r, routineTimes: newTimes }))
      setRoutineNotifIds(ids => {
        const next = { ...ids }; delete next[oldTime]; if (newId) next[newTime] = newId; return next
      })
    } else {
      await cancelNotif(changeTarget.notifId)
      let newId = null
      if (hasPermission) {
        newId = await scheduleDaily(changeTarget.product, newTime).catch(() => null)
      }
      await saveCustoms(customs.map(c => c.id === changeTarget.id ? { ...c, time: newTime, notifId: newId } : c))
    }

    setStatusModal({ visible: true, type: 'success', title: 'Reminder Updated', message: `Notification rescheduled to ${fmt(newTime)} daily.` })
  }

  // ── Render one reminder row ─────────────────────────────────────────────────
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
          {kind === 'routine' && <Text style={styles.routineBadge}>Routine</Text>}
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

  // ── Build day / night lists ─────────────────────────────────────────────────
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

      {/* ── Custom notification permission modal ── */}
      <Modal visible={showPermModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.permCard}>
            <View style={styles.permIconWrap}>
              <Ionicons name="notifications" size={36} color="#E75480" />
            </View>
            <Text style={styles.permTitle}>Stay on Track</Text>
            <Text style={styles.permDesc}>
              Allow Skinalyst to send you daily reminders so you never miss applying your skincare routine.
            </Text>
            <TouchableOpacity style={styles.permEnableBtn} onPress={handleEnableNotifications}>
              <Ionicons name="notifications-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.permEnableBtnText}>Enable Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.permLaterBtn} onPress={handleNotYet}>
              <Text style={styles.permLaterText}>Not Yet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <ActivityIndicator size="large" color="#E75480" />
          <Text style={styles.loadingText}>Loading reminders…</Text>
        </View>
      ) : (
        <>
          {/* Notification permission warning strip */}
          {!hasPermission && (
            <TouchableOpacity style={styles.permStrip} onPress={handleEnableNotifications}>
              <Ionicons name="notifications-off-outline" size={16} color="#C0315E" style={{ marginRight: 8 }} />
              <Text style={styles.permStripText}>Notifications off — tap to enable</Text>
              <Ionicons name="chevron-forward" size={14} color="#C0315E" />
            </TouchableOpacity>
          )}

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
            <Text style={styles.cardSub}>Choose type, time and product name</Text>

            <View style={styles.typeRow}>
              {['Day', 'Night'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, newType === t && (t === 'Day' ? styles.dayActive : styles.nightActive)]}
                  onPress={() => {
                    setNewType(t)
                    // Auto-fill from active routine product if available
                    if (!newProduct && routine?.product?.name) {
                      setNewProduct(routine.product.name)
                    }
                  }}
                >
                  <Ionicons
                    name={t === 'Day' ? 'sunny-outline' : 'moon-outline'}
                    size={14}
                    color={newType === t ? (t === 'Day' ? '#E75480' : '#6C63FF') : '#aaa'}
                    style={{ marginRight: 4 }}
                  />
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
                    placeholder="Product name"
                    placeholderTextColor="#bbb"
                    value={newProduct}
                    onChangeText={setNewProduct}
                  />
                </View>
                {routine?.product?.name && newProduct !== routine.product.name && (
                  <TouchableOpacity
                    style={styles.autofillChip}
                    onPress={() => setNewProduct(routine.product.name)}
                  >
                    <Ionicons name="sparkles" size={12} color="#E75480" style={{ marginRight: 4 }} />
                    <Text style={styles.autofillChipText}>Use: {routine.product.name}</Text>
                  </TouchableOpacity>
                )}
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

      {/* ── Delete confirmation modal ── */}
      <Modal visible={deleteModal.visible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteCard}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash" size={30} color="#E75480" />
            </View>
            <Text style={styles.deleteTitle}>Remove Reminder</Text>
            <Text style={styles.deleteDesc}>
              Delete the reminder for{'\n'}
              <Text style={{ fontFamily: 'Nunito-Bold', color: '#330033' }}>
                "{deleteModal.item?.product}"
              </Text>
              ?{'\n'}This cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteModal({ visible: false, item: null })}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDelete}>
                <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8', marginTop: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#aaa', fontFamily: 'Nunito-Regular', fontSize: 14 },

  // ── Permission modal ────────────────────────────────────────────────────────
  permCard: {
    width: '85%', backgroundColor: '#fff', borderRadius: 24,
    padding: 28, alignItems: 'center',
  },
  permIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFE3ED', alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  permTitle: {
    fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: '#330033',
    marginBottom: 10, textAlign: 'center',
  },
  permDesc: {
    fontSize: 14, fontFamily: 'Nunito-Regular', color: '#666',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  permEnableBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E75480', paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 16, width: '100%', marginBottom: 12,
  },
  permEnableBtnText: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15 },
  permLaterBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  permLaterText: { color: '#aaa', fontFamily: 'Nunito-SemiBold', fontSize: 14 },

  // ── Permission warning strip ────────────────────────────────────────────────
  permStrip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: '#FFEBF0', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#FFB3CC',
  },
  permStripText: {
    flex: 1, fontSize: 13, fontFamily: 'Nunito-SemiBold', color: '#C0315E',
  },

  // ── Active routine banner ───────────────────────────────────────────────────
  banner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 14, borderWidth: 1,
  },
  bannerGreen: { backgroundColor: '#E6FBF4', borderColor: '#00C896' },
  bannerPink:  { backgroundColor: '#FFF0F5', borderColor: '#FFD1E1' },
  bannerTitle: { fontFamily: 'Nunito-Bold', color: '#00916E', fontSize: 13 },
  bannerSub:   { fontFamily: 'Nunito-Regular', color: '#555', fontSize: 12, marginTop: 2 },

  // ── Add reminder card ───────────────────────────────────────────────────────
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
  dayActive:       { backgroundColor: '#FFE3ED', borderColor: '#E75480' },
  nightActive:     { backgroundColor: '#E8E7FF', borderColor: '#6C63FF' },
  typeText:        { fontFamily: 'Nunito-SemiBold', color: '#aaa' },
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

  // ── Reminder lists ──────────────────────────────────────────────────────────
  listSection: { paddingHorizontal: 16, marginTop: 28 },
  sectionRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: '#E75480' },
  emptyText:   { color: '#ccc', fontFamily: 'Nunito-Regular', fontSize: 13 },

  reminderItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 14, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  typeBadge:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayBadge:   { backgroundColor: '#FFE3ED' },
  nightBadge: { backgroundColor: '#E8E7FF' },
  reminderTextWrapper: { flex: 1, marginLeft: 12 },
  remTitle:   { fontFamily: 'Nunito-Bold', color: '#330033', fontSize: 14 },
  remSub:     { fontFamily: 'Nunito-Regular', color: '#777', fontSize: 12, marginTop: 2 },
  routineBadge: {
    alignSelf: 'flex-start', marginTop: 4,
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
  autofillChip: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start', marginTop: 8,
    backgroundColor: '#FFE3ED', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#F28BA8',
  },
  autofillChipText: { color: '#E75480', fontFamily: 'Nunito-SemiBold', fontSize: 12 },

  // ── Shared modal styles ─────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: { width: '88%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontFamily: 'Nunito-ExtraBold', color: '#330033', fontSize: 16, marginBottom: 4 },
  pickerLabel: { fontFamily: 'Nunito-SemiBold', color: '#330033', marginBottom: 3, fontSize: 13 },
  pickerItem:  { color: '#330033', fontSize: 20, height: 160 },
  modalActions: { marginTop: 16, flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#FFD1E1',
  },
  modalBtnPrimary: { backgroundColor: '#E75480', borderColor: '#E75480' },
  modalBtnText: { fontFamily: 'Nunito-Bold', color: '#E75480', fontSize: 14 },

  // ── Delete confirmation modal ───────────────────────────────────────────────
  deleteCard: {
    width: '82%', backgroundColor: '#fff', borderRadius: 24,
    padding: 28, alignItems: 'center',
  },
  deleteIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FFE3ED', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 18, fontFamily: 'Nunito-ExtraBold', color: '#330033',
    marginBottom: 10, textAlign: 'center',
  },
  deleteDesc: {
    fontSize: 14, fontFamily: 'Nunito-Regular', color: '#666',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  deleteActions: { flexDirection: 'row', gap: 12, width: '100%' },
  deleteCancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFD1E1', backgroundColor: '#fff',
  },
  deleteCancelText: { fontFamily: 'Nunito-Bold', color: '#E75480', fontSize: 14 },
  deleteConfirmBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E75480',
  },
  deleteConfirmText: { fontFamily: 'Nunito-Bold', color: '#fff', fontSize: 14 },
})

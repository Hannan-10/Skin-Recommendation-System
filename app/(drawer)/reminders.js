import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, Modal } from 'react-native'
import ScreenHeader from '../components/ScreenHeader'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import StatusModal from '../components/StatusModal'
import { Picker } from '@react-native-picker/picker'

export default function Reminders() {
  const router = useRouter()

  const [dayTime, setDayTime] = useState(new Date())
  const [nightTime, setNightTime] = useState(new Date())
  const [showDay, setShowDay] = useState(false)
  const [showNight, setShowNight] = useState(false)

  const [modalVisible, setModalVisible] = useState(false)

  const [newType, setNewType] = useState(null)
  const [newTime, setNewTime] = useState(null)
  const [newProduct, setNewProduct] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newTempTime, setNewTempTime] = useState(null)
  const [newHour, setNewHour] = useState(12)
  const [newMinute, setNewMinute] = useState(0)
  const [newAmPm, setNewAmPm] = useState('AM')

  const [reminders, setReminders] = useState([
    { id: 'r1', type: 'Day', time: new Date(), product: 'Sunscreen SPF50' },
    { id: 'r2', type: 'Night', time: new Date(), product: 'Retinol Serum' },
  ])

  const onChangeDay = (_e, selected) => {
    if (Platform.OS === 'android') setShowDay(false)
    if (selected) setDayTime(selected)
  }

  const onChangeNight = (_e, selected) => {
    if (Platform.OS === 'android') setShowNight(false)
    if (selected) setNightTime(selected)
  }

  const onChangeNew = (_e, selected) => {
    if (Platform.OS === 'android') setShowNew(false)
    if (selected) setNewTime(selected)
  }

  const addReminder = () => {
    if (!newType || !newTime || !newProduct.trim()) return

    setReminders(prev => [
      ...prev,
      { id: String(Date.now()), type: newType, time: newTime, product: newProduct.trim() },
    ])

    // Reset form
    setNewType(null)
    setNewTime(null)
    setNewProduct('')
    setShowNew(false)
    setModalVisible(true)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      <View style={styles.headerRow}>
        <ScreenHeader title="Reminders" onBack={() => router.replace('/(drawer)/(tabs)/home')} />
      </View>

      {/* DAY ROUTINE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Day Routine ☀️</Text>
        <Text style={styles.cardSub}>Set a reminder for your daytime products</Text>

        <TouchableOpacity style={[styles.timeBtn, styles.dayBtn]} onPress={() => setShowDay(true)}>
          <Text style={styles.timeBtnText}>
            {dayTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showDay && (
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={dayTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              //themeVariant="dark"
              onChange={onChangeDay}
            />
          </View>
        )}
      </View>

      {/* NIGHT ROUTINE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Night Routine 🌙</Text>
        <Text style={styles.cardSub}>Set a reminder for your nighttime products</Text>

        <TouchableOpacity style={[styles.timeBtn, styles.nightBtn]} onPress={() => setShowNight(true)}>
          <Text style={styles.timeBtnText}>
            {nightTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showNight && (
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={nightTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant="dark"
              onChange={onChangeNight}
            />
          </View>
        )}
      </View>

      {/* ADD REMINDER */}
      <View style={[styles.card, { marginTop: 24 }]}>
        <Text style={styles.cardTitle}>Add Reminder</Text>
        <Text style={styles.cardSub}>Choose routine, time and product</Text>

        <View style={styles.typeRow}>
          {['Day', 'Night'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeChip,
                newType === t && (t === 'Day' ? styles.dayChipActive : styles.nightChipActive)
              ]}
              onPress={() => {
                setNewType(t)
                setNewTime(null)
                setNewProduct('')
              }}
            >
              <Text style={[styles.typeText, newType === t && styles.typeTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {newType && (
          <>
            <TouchableOpacity
              style={styles.addFormTimeBtn}
              onPress={() => {
                const base = newTime || new Date()
                const hr = base.getHours()
                const min = base.getMinutes()
                const ampm = hr >= 12 ? 'PM' : 'AM'
                const hr12 = hr % 12 || 12
                setNewHour(hr12)
                setNewMinute(min)
                setNewAmPm(ampm)
                setNewTempTime(base)
                setShowNew(true)
              }}
            >
              <Text style={styles.addFormTimeBtnText}>
                {newTime ? newTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set Time'}
              </Text>
            </TouchableOpacity>

            {/* ADD REMINDER TIME MODAL */}
            <Modal visible={showNew} transparent animationType="fade">
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Select Time</Text>
                  <View style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, justifyContent: 'center' }}>

                      {/* Hour */}
                      <View style={{ width: 90, marginRight: 8 }}>
                        <Text style={styles.pickerLabel}>Hour</Text>
                        <Picker
                          selectedValue={newHour}
                          onValueChange={setNewHour}
                          itemStyle={styles.pickerItem}
                        >
                          {[...Array(12)].map((_, i) => (
                            <Picker.Item key={i + 1} label={`${i + 1}`} value={i + 1} />
                          ))}
                        </Picker>
                      </View>

                      {/* Minute */}
                      <View style={{ width: 90, marginHorizontal: 8 }}>
                        <Text style={styles.pickerLabel}>Minute</Text>
                        <Picker
                          selectedValue={newMinute}
                          onValueChange={setNewMinute}
                          itemStyle={styles.pickerItem}
                        >
                          {[...Array(60)].map((_, i) => (
                            <Picker.Item key={i} label={i.toString().padStart(2, '0')} value={i} />
                          ))}
                        </Picker>
                      </View>

                      {/* AM/PM */}
                      <View style={{ width: 90, marginLeft: 8 }}>
                        <Text style={styles.pickerLabel}>AM/PM</Text>
                        <Picker
                          selectedValue={newAmPm}
                          onValueChange={setNewAmPm}
                          itemStyle={styles.amPmPickerItem}
                        >
                          <Picker.Item label="AM" value="AM" />
                          <Picker.Item label="PM" value="PM" />
                        </Picker>
                      </View>

                    </View>
                  </View>

                  {/* Modal actions */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.smallBtn} onPress={() => setShowNew(false)}>
                      <Text style={styles.smallBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => {
                        const d = new Date()
                        const hr24 = newAmPm === 'PM' ? ((newHour % 12) + 12) : (newHour % 12)
                        d.setHours(hr24)
                        d.setMinutes(newMinute)
                        d.setSeconds(0)
                        setNewTime(d)
                        setShowNew(false)
                      }}
                    >
                      <Text style={styles.smallBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}

        {newType && newTime && (
          <TextInput
            style={styles.input}
            placeholder="Product (e.g., Cleanser, Moisturizer)"
            placeholderTextColor="#999"
            value={newProduct}
            onChangeText={setNewProduct}
          />
        )}

        {newType && newTime && newProduct.trim().length > 0 && (
          <TouchableOpacity style={styles.addBtn} onPress={addReminder}>
            <Text style={styles.addBtnText}>Add Reminder</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* REMINDER LIST */}
      <View style={styles.listWrapper}>
        <Text style={styles.sectionHeader}>☀️ Day Routine</Text>
        {reminders.filter(r => r.type === 'Day').map((r) => (
          <View key={r.id} style={styles.reminderItem}>
            <View style={[styles.typeBadge, styles.dayBadge]}>
              <Text style={styles.badgeText}>Day</Text>
            </View>

            <View style={styles.reminderTextWrapper}>
              <Text style={styles.remTitle} numberOfLines={1}>
                {r.product}
              </Text>
              <Text style={styles.remSub}>
                {r.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <TouchableOpacity style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>🌙 Night Routine</Text>
        {reminders.filter(r => r.type === 'Night').map((r) => (
          <View key={r.id} style={styles.reminderItem}>
            <View style={[styles.typeBadge, styles.nightBadge]}>
              <Text style={styles.badgeText}>Night</Text>
            </View>

            <View style={styles.reminderTextWrapper}>
              <Text style={styles.remTitle} numberOfLines={1}>
                {r.product}
              </Text>
              <Text style={styles.remSub}>
                {r.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <TouchableOpacity style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <StatusModal
        visible={modalVisible}
        type="success"
        title="Reminders Saved"
        message="Your reminders have been successfully updated."
        primaryLabel="OK"
        onPrimary={() => setModalVisible(false)}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
    marginTop: 25,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#E75480',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cardTitle: { fontSize: 17, color: '#330033', fontFamily: 'Nunito-ExtraBold' },
  cardSub: { fontSize: 13, color: '#777', marginTop: 6, fontFamily: 'Nunito-Regular' },
  timeBtn: { marginTop: 14, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: '#FDE3EC' },
  dayBtn: { backgroundColor: '#E75480' },
  nightBtn: { backgroundColor: '#6C63FF' },
  timeBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito-Bold' },
  pickerWrapper: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  typeRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  typeChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#FFD1E1', backgroundColor: '#fff' },
  dayChipActive: { backgroundColor: '#FFE3ED', borderColor: '#E75480' },
  nightChipActive: { backgroundColor: '#E8E7FF', borderColor: '#6C63FF' },
  typeText: { fontFamily: 'Nunito-SemiBold', color: '#333' },
  typeTextActive: { color: '#E75480' },
  addFormTimeBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#FFF0F5', borderWidth: 1, borderColor: '#E75480' },
  addFormTimeBtnText: { color: '#E75480', fontFamily: 'Nunito-Bold', fontSize: 15 },
  input: { marginTop: 14, borderWidth: 1, borderColor: '#FDEEF4', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', fontFamily: 'Nunito-Regular', color: '#333' },
  addBtn: { marginTop: 16, backgroundColor: '#330033', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  addBtnText: { color: '#fff', fontFamily: 'Nunito-Bold' },
  listWrapper: { paddingHorizontal: 16, marginTop: 30 },
  sectionHeader: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: '#330033', marginBottom: 12 },
  reminderItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  reminderTextWrapper: { flex: 1, marginLeft: 12 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  dayBadge: { backgroundColor: '#FFE3ED' },
  nightBadge: { backgroundColor: '#E8E7FF' },
  badgeText: { fontFamily: 'Nunito-Bold', fontSize: 12 },
  remTitle: { fontFamily: 'Nunito-Bold', color: '#330033' },
  remSub: { fontFamily: 'Nunito-Regular', color: '#777', marginTop: 3 },
  smallBtn: { backgroundColor: '#FFF0F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FFD1E1' },
  smallBtnText: { color: '#E75480', fontFamily: 'Nunito-Bold', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  modalTitle: { fontFamily: 'Nunito-Bold', color: '#330033', fontSize: 16 },
  modalActions: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerLabel: { fontFamily: 'Nunito-SemiBold', color: '#330033', marginBottom: 3 },
  pickerItem: { color: '#330033', fontFamily: 'Nunito-Bold', fontSize: 20, height: 160 },
  amPmPickerItem: {
    color: '#330033',
    fontFamily: 'Nunito-Bold',
    fontSize: 18,   // smaller so AM/PM fits fully
    height: 160,
  },
})

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { saveAllergyProfile } from '../firebase/user';

const INGREDIENT_ALLERGENS = [
  { id: 'fragrance',       label: 'Fragrance / Parfum' },
  { id: 'alcohol',         label: 'Alcohol (Ethanol)' },
  { id: 'parabens',        label: 'Parabens' },
  { id: 'sulfates',        label: 'Sulfates (SLS/SLES)' },
  { id: 'retinol',         label: 'Retinol / Vitamin A' },
  { id: 'salicylic_acid',  label: 'Salicylic Acid' },
  { id: 'benzoyl_peroxide',label: 'Benzoyl Peroxide' },
  { id: 'essential_oils',  label: 'Essential Oils' },
  { id: 'silicones',       label: 'Silicones' },
  { id: 'niacinamide',     label: 'Niacinamide' },
];

const SKIN_SENSITIVITIES = [
  { id: 'sensitive',  label: 'Sensitive Skin',      icon: 'alert-circle-outline' },
  { id: 'rosacea',    label: 'Rosacea',              icon: 'flame-outline' },
  { id: 'eczema',     label: 'Eczema / Dermatitis',  icon: 'bandage-outline' },
  { id: 'psoriasis',  label: 'Psoriasis',            icon: 'layers-outline' },
];

export default function AllergyProfile() {
  const router = useRouter();
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [selectedSensitivities, setSelectedSensitivities] = useState([]);
  const [customNotes, setCustomNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (list, setList, id) => {
    setList(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAllergyProfile({
        allergens: selectedAllergens,
        sensitivities: selectedSensitivities,
        customNotes: customNotes.trim(),
      });
    } catch (e) {
      // Non-fatal — continue to home even if save fails
    } finally {
      setSaving(false);
      router.replace('/home');
    }
  };

  const handleSkip = () => router.replace('/home');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <LinearGradient colors={['#E75480', '#FF6B9D', '#FFB3CC']} style={styles.header}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="shield-checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Allergy & Sensitivity Profile</Text>
            <Text style={styles.headerSub}>
              Help us avoid ingredients that don't work for your skin. You can always update this later.
            </Text>
          </LinearGradient>

          {/* ── Ingredient Allergies ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flask-outline" size={18} color="#E75480" />
              <Text style={styles.sectionTitle}>Ingredient Allergies</Text>
            </View>
            <Text style={styles.sectionSub}>
              Select any ingredients your skin reacts to
            </Text>
            <View style={styles.chipGrid}>
              {INGREDIENT_ALLERGENS.map(item => {
                const active = selectedAllergens.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggle(selectedAllergens, setSelectedAllergens, item.id)}
                    activeOpacity={0.75}
                  >
                    {active && (
                      <Ionicons name="close-circle" size={14} color="#E75480" style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Skin Sensitivities ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="body-outline" size={18} color="#E75480" />
              <Text style={styles.sectionTitle}>Skin Conditions</Text>
            </View>
            <Text style={styles.sectionSub}>
              Do you have any of the following?
            </Text>
            <View style={styles.sensitivityList}>
              {SKIN_SENSITIVITIES.map(item => {
                const active = selectedSensitivities.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.sensitivityRow, active && styles.sensitivityRowActive]}
                    onPress={() => toggle(selectedSensitivities, setSelectedSensitivities, item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.sensitivityIcon, active && styles.sensitivityIconActive]}>
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={active ? '#fff' : '#E75480'}
                      />
                    </View>
                    <Text style={[styles.sensitivityLabel, active && styles.sensitivityLabelActive]}>
                      {item.label}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark-circle" size={20} color="#E75480" style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Custom Notes ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="create-outline" size={18} color="#E75480" />
              <Text style={styles.sectionTitle}>Other Notes (Optional)</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. allergic to shea butter, avoid zinc oxide…"
              placeholderTextColor="#bbb"
              multiline
              numberOfLines={3}
              value={customNotes}
              onChangeText={setCustomNotes}
              textAlignVertical="top"
            />
          </View>

          {/* ── Buttons ── */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name="checkmark-done-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving…' : 'Save & Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9F6' },
  container: { paddingBottom: 40 },

  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Nunito-ExtraBold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#E75480',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1A1A1A',
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#888',
    marginBottom: 14,
    marginTop: 2,
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE2E8',
    backgroundColor: '#FFF9F6',
  },
  chipActive: {
    borderColor: '#E75480',
    backgroundColor: '#FFE3ED',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#555',
  },
  chipTextActive: {
    color: '#E75480',
  },

  sensitivityList: { gap: 10 },
  sensitivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FDE2E8',
    backgroundColor: '#FFF9F6',
  },
  sensitivityRowActive: {
    borderColor: '#E75480',
    backgroundColor: '#FFE3ED',
  },
  sensitivityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFE3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensitivityIconActive: {
    backgroundColor: '#E75480',
  },
  sensitivityLabel: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#333',
  },
  sensitivityLabelActive: {
    color: '#E75480',
  },

  notesInput: {
    backgroundColor: '#FFF9F6',
    borderWidth: 1.5,
    borderColor: '#FDE2E8',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#333',
    minHeight: 80,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E75480',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#E75480',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito-Bold',
    color: '#fff',
  },

  skipBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
  },
  skipBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#aaa',
    textDecorationLine: 'underline',
  },
});

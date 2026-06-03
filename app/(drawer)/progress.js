// import React, { useState } from 'react';
import React, { useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Stack, useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import StackedBar from '../components/StackedBar'
import PieChart from '../components/PieChart'

export default function Progress() {
  const router = useRouter()
  const [filterDays, setFilterDays] = useState('2')
  const [date, setDate] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)

  const onChange = (_e, selectedDate) => {
    if (Platform.OS === 'android') setShowCalendar(false)
    if (selectedDate) setDate(selectedDate)
  }

  const toggleCalendar = () => setShowCalendar(!showCalendar)
  const goHome = () => router.replace('/(drawer)/(tabs)/home')

  const CONDITION_COLORS = {
  Acne: '#E75480',
  Wrinkles: '#FF9DB3',
  Pores: '#FBC6D5',
  Spots: '#FADDE5',
  Blackheads: '#FFE8F0',
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.demoBanner}>
        <Ionicons name="information-circle" size={14} color="#fff" />
        <Text style={styles.demoText}>PREVIEW MODE: This is a demo dashboard</Text>
      </View>

      <View style={styles.topNav}>
        <View style={styles.leftNav}>
          <TouchableOpacity style={styles.backBtn} onPress={goHome}>
            <Ionicons name="arrow-back" size={22} color="#2D2D2D" />
          </TouchableOpacity>
          <View>
            <Text style={styles.welcomeText}>Progress Report</Text>
            <Text style={styles.headerTitle}>My Skin Journey</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.calendarButton, showCalendar && styles.calendarActive]} onPress={toggleCalendar}>
          <Ionicons name={showCalendar ? 'close-outline' : 'calendar-outline'} size={26} color={showCalendar ? '#fff' : '#E75480'} />
        </TouchableOpacity>
      </View>

      {showCalendar && (
        <View style={styles.pickerContainer}>
          <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'calendar'} onChange={onChange} themeVariant="dark" />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowCalendar(false)}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabWrapper}>
          <View style={styles.tabContainer}>
            {[
              { key: '2', label: 'After 2 Days' },
              { key: '7', label: 'After 7 Days' },
              { key: '14', label: 'After 14 Days' },
            ].map((tab) => (
              <TouchableOpacity key={tab.key} onPress={() => setFilterDays(tab.key)} style={[styles.tab, filterDays === tab.key && styles.activeTab]}>
                <Text style={[styles.tabText, filterDays === tab.key && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.dateDisplay}>Selected: {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>

        {['After 2 Days Progress', 'After 7 Days Progress', 'After 14 Days Progress'].map((title, idx) => {
          const key = idx === 0 ? '2' : idx === 1 ? '7' : '14'
          if (filterDays !== key) return null
          return (
          <View key={title} style={styles.progressBlock}>
            <Text style={styles.blockTitle}>{title}</Text>
            <Text style={styles.blockSub}>Acne reduced from {idx === 0 ? '40%' : idx === 1 ? '40%' : '40%'} to {idx === 0 ? '33%' : idx === 1 ? '25%' : '15%'}</Text>
            <View style={styles.piesRow}>
              <View style={styles.pieCard}>
                <PieChart
                  data={[
                    { value: 40, color: '#E75480', label: 'Acne' },
                    { value: 20, color: '#FF9DB3', label: 'Wrinkles' },
                    { value: 15, color: '#FBC6D5', label: 'Pores' },
                    { value: 15, color: '#FADDE5', label: 'Spots' },
                    { value: 10, color: '#FFE8F0', label: 'Blackheads' },
                  ]}
                  size={120}
                />
                <Text style={styles.pieLabel}>Before</Text>
              </View>
              <View style={styles.pieCard}>
                <PieChart
                  data={[
                    { value: idx === 0 ? 33 : idx === 1 ? 25 : 15, color: '#E75480', label: 'Acne' },
                    { value: 20, color: '#FF9DB3', label: 'Wrinkles' },
                    { value: 15, color: '#FBC6D5', label: 'Pores' },
                    { value: idx === 0 ? 12 : 10, color: '#FADDE5', label: 'Spots' },
                    { value: idx === 0 ? 20 : (idx === 1 ? 30 : 55), color: '#FFE8F0', label: 'Blackheads' },
                  ]}
                  size={120}
                />
                <Text style={styles.pieLabel}>After</Text>
              </View>
            </View>
            <View style={styles.legendRow}>
              {[{ label: 'Acne', color: '#E75480' }, { label: 'Wrinkles', color: '#FF9DB3' }, { label: 'Pores', color: '#FBC6D5' }, { label: 'Spots', color: '#FADDE5' }, { label: 'Blackheads', color: '#FFE8F0' }].map((it, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: it.color }]} />
                  <Text style={styles.legendText}>{it.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )})}

        <View style={styles.guide}>
          <Text style={styles.guideTitle}>Condition Guide (Color Code)</Text>
          <View style={styles.guideRow}>
            {Object.keys(CONDITION_COLORS).map((condition, i) => (
  <View key={i} style={styles.legendItem}>
    <View
      style={[
        styles.legendDot,
        { backgroundColor: CONDITION_COLORS[condition] },
      ]}
    />
    <Text style={styles.legendText}>{condition}</Text>
  </View>
))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F6' },
  demoBanner: { backgroundColor: '#E75480', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 4, gap: 5 },
  demoText: { color: '#fff', fontSize: 10, fontFamily: 'Nunito-Bold' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 12 },
  leftNav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 12, shadowColor: '#E75480', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  welcomeText: { fontSize: 14, color: '#888', fontFamily: 'Nunito-Regular' },
  headerTitle: { fontSize: 26, color: '#2D2D2D', fontFamily: 'Nunito-ExtraBold' },
  calendarButton: { backgroundColor: '#fff', padding: 10, borderRadius: 15, elevation: 4 },
  calendarActive: { backgroundColor: '#E75480' },
  pickerContainer: { backgroundColor: '#E75480', marginHorizontal: 20, borderRadius: 20, padding: 12, elevation: 5, borderWidth: 1, borderColor: '#FFD1E1' },
  doneButton: { alignSelf: 'center', padding: 10 },
  doneText: { color: '#E75480', fontFamily: 'Nunito-Bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  tabWrapper: { alignItems: 'center', marginVertical: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF0F3', borderRadius: 30, padding: 4, width: '100%' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 25 },
  activeTab: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 14, color: '#888', fontFamily: 'Nunito-SemiBold' },
  activeTabText: { color: '#E75480', fontFamily: 'Nunito-Bold' },
  dateDisplay: { textAlign: 'center', color: '#A0A0A0', marginBottom: 10, fontSize: 13, fontFamily: 'Nunito-Regular' },
  progressBlock: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  blockTitle: { fontSize: 16, color: '#E75480', fontFamily: 'Nunito-Bold' },
  blockSub: { fontSize: 12, color: '#27AE60', marginTop: 2, fontFamily: 'Nunito-Regular' },
  piesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  pieCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 10, alignItems: 'center', elevation: 1 },
  piePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFE3ED' },
  pieLabel: { marginTop: 6, fontSize: 12, color: '#888', fontFamily: 'Nunito-Regular' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#888', fontFamily: 'Nunito-Regular' },
  guide: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: '#FFF0F3' },
  guideTitle: { fontSize: 14, color: '#330033', fontFamily: 'Nunito-Bold' },
  guideRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
})
// import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Stack, useRouter } from 'expo-router';
// import DateTimePicker from '@react-native-community/datetimepicker';

// export default function Progress() {
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState('Weekly');
//   const [date, setDate] = useState(new Date());
//   const [showCalendar, setShowCalendar] = useState(false);

//   const onChange = (event, selectedDate) => {
//     if (Platform.OS === 'android') {
//       setShowCalendar(false);
//     }
    
//     if (selectedDate) {
//       setDate(selectedDate);
//     }
//   };

//   // Toggle Function for Calendar
//   const toggleCalendar = () => {
//     setShowCalendar(!showCalendar);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
//       <Stack.Screen options={{ headerShown: false }} />

//       {/* 🚩 Stylish Demo Banner */}
//       <View style={styles.demoBanner}>
//         <Ionicons name="information-circle" size={14} color="#fff" />
//         <Text style={styles.demoText}>PREVIEW MODE: This is a demo dashboard</Text>
//       </View>
      
//       {/* 🔝 Premium Top Navigation */}
//       <View style={styles.topNav}>
//         <View style={styles.leftNav}>
//           <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
//             <Ionicons name="arrow-back" size={22} color="#2D2D2D" />
//           </TouchableOpacity>
//           <View>
//           <Text style={styles.welcomeText}>Progress Report</Text>
//           <Text style={styles.headerTitle}>My Skin Journey</Text>
//           </View>
//         </View>
        
//         <TouchableOpacity 
//           style={[styles.calendarButton, showCalendar && styles.calendarActive]} 
//           onPress={toggleCalendar}
//         >
//           <Ionicons 
//             name={showCalendar ? "close-outline" : "calendar-outline"} 
//             size={26} 
//             color={showCalendar ? "#fff" : "#E75480"} 
//           />
//         </TouchableOpacity>
//       </View>

//       {/* ✅ Premium Date Picker Section */}
//       {showCalendar && (
//         <View style={styles.pickerContainer}>
//           <DateTimePicker
//             value={date}
//             mode="date"
//             display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
//             onChange={onChange}
//             themeVariant="light"
//             textColor="#2D2D2D"
//             accentColor="#E75480"
//             style={styles.datePicker}
//           />
//           {Platform.OS === 'ios' && (
//             <TouchableOpacity style={styles.doneButton} onPress={() => setShowCalendar(false)}>
//               <Text style={styles.doneText}>Done</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       )}

//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
//         {/* 🗓️ Elegant Tabs */}
//         <View style={styles.tabWrapper}>
//           <View style={styles.tabContainer}>
//             {['Daily', 'Weekly', 'Monthly'].map((tab) => (
//               <TouchableOpacity 
//                 key={tab} 
//                 onPress={() => setActiveTab(tab)}
//                 style={[styles.tab, activeTab === tab && styles.activeTab]}
//               >
//                 <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         <Text style={styles.dateDisplay}>
//            Selected: {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
//         </Text>

//         {/* 🎯 Master Health Card (Glassmorphism Style) */}
//         <View style={styles.mainCard}>
//           <View style={styles.cardInfo}>
//             <View style={styles.trendBadge}>
//               <Ionicons name="trending-up" size={12} color="#4CAF50" />
//               <Text style={styles.trendText}>+12% improve</Text>
//             </View>
//             <Text style={styles.cardTitle}>Skin Score</Text>
//             <Text style={styles.cardSub}>Consistency is paying off!</Text>
//           </View>
          
//           <View style={styles.scoreContainer}>
//              <View style={styles.scoreCircle}>
//                 <Text style={styles.scoreText}>82</Text>
//                 <Text style={styles.scoreUnit}>%</Text>
//              </View>
//           </View>
//         </View>

//         {/* 📊 Placeholder for Charts */}
//         <View style={styles.chartPlaceholder}>
//             <Text style={styles.placeholderText}>Visual Analytics Coming Soon</Text>
//         </View>

//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#FFF9F6' },
  
//   // Demo Banner
//   demoBanner: { 
//     backgroundColor: '#E75480', 
//     flexDirection: 'row', 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     paddingVertical: 4, 
//     gap: 5,
//     borderBottomLeftRadius: 10,
//     borderBottomRightRadius: 10
//   },
//   demoText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, fontFamily: 'Nunito-Bold' },

//   // Top Nav
//   topNav: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center', 
//     paddingHorizontal: 25, 
//     paddingTop: 30, 
//     paddingBottom: 15 
//   },
//   leftNav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   backBtn: { 
//     backgroundColor: '#fff', 
//     padding: 10, 
//     borderRadius: 12,
//     shadowColor: '#E75480',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 2
//   },
//   welcomeText: { fontSize: 14, color: '#888', fontWeight: '500', fontFamily: 'Nunito-Regular' },
//   headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#2D2D2D', fontFamily: 'Nunito-ExtraBold' },
  
//   calendarButton: { 
//     backgroundColor: '#fff', 
//     padding: 10, 
//     borderRadius: 15,
//     shadowColor: '#E75480',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 4
//   },
//   calendarActive: { backgroundColor: '#E75480' },

//   // Picker
//   pickerContainer: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, padding: 12, elevation: 5, borderWidth: 1, borderColor: '#F0F0F0' },
//   datePicker: { alignSelf: 'stretch' },
//   doneButton: { alignSelf: 'center', padding: 10 },
//   doneText: { color: '#E75480', fontWeight: 'bold', fontFamily: 'Nunito-Bold' },

//   scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
//   // Tabs
//   tabWrapper: { alignItems: 'center', marginVertical: 20 },
//   tabContainer: { 
//     flexDirection: 'row', 
//     backgroundColor: '#FFF0F3', 
//     borderRadius: 30, 
//     padding: 4,
//     width: '100%',
//     shadowColor: '#E75480',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 2
//   },
//   tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 25 },
//   activeTab: { backgroundColor: '#fff', shadowColor: '#E75480', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
//   tabText: { fontSize: 14, color: '#888', fontWeight: '600', fontFamily: 'Nunito-SemiBold' },
//   activeTabText: { color: '#E75480', fontFamily: 'Nunito-Bold' },

//   dateDisplay: { textAlign: 'center', color: '#A0A0A0', marginBottom: 20, fontSize: 13, fontStyle: 'italic', fontFamily: 'Nunito-Regular' },

//   // Main Card
//   mainCard: { 
//     backgroundColor: 'rgba(231,84,128,0.9)', 
//     borderRadius: 30, 
//     padding: 25, 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center',
//     shadowColor: '#E75480',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.3,
//     shadowRadius: 20,
//     elevation: 10
//   },
//   trendBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
//   trendText: { color: '#fff', fontSize: 10, fontWeight: 'bold', fontFamily: 'Nunito-Bold' },
//   cardTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', fontFamily: 'Nunito-ExtraBold' },
//   cardSub: { color: '#FFD1E0', fontSize: 13, marginTop: 4, fontFamily: 'Nunito-Regular' },
  
//   scoreCircle: { 
//     width: 90, 
//     height: 90, 
//     borderRadius: 45, 
//     backgroundColor: 'rgba(255,255,255,0.2)', 
//     justifyContent: 'center', 
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: 'rgba(255,255,255,0.4)',
//     shadowColor: '#fff',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//   },
//   scoreText: { fontSize: 32, fontWeight: 'bold', color: '#fff', fontFamily: 'Nunito-Bold' },
//   scoreUnit: { fontSize: 14, color: '#fff', fontWeight: '600', fontFamily: 'Nunito-SemiBold' },

//   chartPlaceholder: { 
//     height: 200, 
//     backgroundColor: '#fff', 
//     borderRadius: 30, 
//     marginTop: 25, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     borderWidth: 1, 
//     borderColor: '#F0F0F0', 
//     borderStyle: 'dashed',
//     shadowColor: '#E75480',
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.05,
//     shadowRadius: 10,
//     elevation: 3
//   },
//   placeholderText: { color: '#CCC', fontSize: 14, fontFamily: 'Nunito-Regular' }
// });

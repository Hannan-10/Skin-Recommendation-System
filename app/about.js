
// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';

// export default function AboutOurApp() {
//   const router = useRouter();

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F6' }}>
//       <View style={styles.headerBar}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color="#E75480" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>About Our App</Text>
//         <View style={{ width: 40 }} />
//       </View>

//       <ScrollView contentContainerStyle={styles.container}>
//         <View style={styles.imageWrapper}>
//           {/* Make sure about.jpeg exists in this path */}
//           <Image
//             source={require('../assets/images/about.jpeg')}
//             style={styles.mainImage}
//           />
//         </View>

//         <View style={styles.textSection}>
//           <Text style={styles.title}>About Skinalyst</Text>
          
//           <View style={styles.infoCard}>
//             <Text style={styles.description}>
//               Skinalyst helps you discover what your skin truly needs.
// Through personalized analysis and thoughtful care, we guide you toward long-lasting skin health and a glow that feels real.
//             </Text>
//           </View>
//            <View style={styles.highlights}>
//           <Text style={styles.highlightText}>✨ Instant Skin Analysis</Text>
//            <Text style={styles.highlightText}>✨ Personalized Routines</Text>
//            <Text style={styles.highlightText}>✨ Product Recommendations</Text>
//          </View>
//         </View>

//         <TouchableOpacity
//           style={styles.mainButton}
//           onPress={() => router.replace('/signup')} 
//         >
//           <Text style={styles.buttonText}>Start Your Journey</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   headerBar: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
//   headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
//   backButton: { padding: 5 },
//   container: { flexGrow: 1, alignItems: 'center', paddingBottom: 30 },
//   imageWrapper: { width: '100%', height: 300, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden' },
//   mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
//   textSection: { padding: 25, alignItems: 'center' },
//   title: { fontSize: 26, fontWeight: 'bold', color: '#E75480' },
//   tagline: { fontSize: 16, color: '#F28BA8', fontWeight: '600', marginBottom: 15 },
//   infoCard: { backgroundColor: '#fff', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#FDE2E8' },
//   description: { textAlign: 'center', color: '#555', lineHeight: 20 },
//   mainButton: { backgroundColor: '#330033', paddingVertical: 15, paddingHorizontal: 50, borderRadius: 30, width: '85%', alignItems: 'center', marginTop: 20 },
//   buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
//   highlights: {
//     marginTop: 15,
//     alignSelf: 'flex-start',
//     width: '100%',
//   }
// });
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutOurApp() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F6' }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E75480" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About App</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={require('../assets/images/about.jpeg')}
            style={styles.mainImage}
          />
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>About Skinalyst</Text>
          <Text style={styles.tagline}>Smart skincare that adapts to you</Text>

          <View style={styles.infoCard}>
            <Text style={styles.description}>
              Skinalyst helps you understand what your skin truly needs.
              Through thoughtful analysis and personalized care, we support
              your journey toward healthy, and naturally glowing skin.
            </Text>
          </View>

          <View style={styles.chipsWrap}>
            {['Skin Analysis', 'Product Guidance', 'Skin Routines', 'Progress Tracking'].map((t, i) => (
              <View key={i} style={styles.chip}>
                <Ionicons name="sparkles-outline" size={16} color="#E75480" style={{ marginRight: 6 }} />
                <Text style={styles.chipText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => router.replace('/signup')}
        >
          <Text style={styles.buttonText}>Start Your Journey</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#333',
  },
  backButton: {
    padding: 5,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 30,
  },
  imageWrapper: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textSection: {
    padding: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Nunito-ExtraBold',
    color: '#E75480',
  },
  tagline: {
    fontSize: 14,
    color: '#F28BA8',
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FDE2E8',
    width: '92%',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  description: {
    textAlign: 'center',
    color: '#555',
    lineHeight: 22,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
  },
  chipsWrap: {
    marginTop: 16,
    width: '92%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    //paddingHorizontal: 6
  },
  chip: {
    width: '48%',
    minHeight: 40,             // ensures consistent height
    backgroundColor: '#FFE3ED',
    paddingHorizontal: 10,
    borderRadius: 18,           // slightly smaller radius
    borderWidth: 1,
    borderColor: '#FDE2E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  chipText: {
    color: '#E75480',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    textAlign: 'center',
    flexShrink: 1,              // allows text to wrap instead of squishing
  },
mainButton: {
  backgroundColor: '#E75480',          // Keep your brand color
  paddingVertical: 16,                  // slightly taller for better touch area
  paddingHorizontal: 40,                // slightly narrower for proportion
  borderRadius: 20,                     // softer round corners, not too pill-shaped
  width: '85%',
  alignItems: 'center',
  justifyContent: 'center',             // ensures text is centered vertically
  //marginTop: 15,                        // add a bit more top spacing
  elevation: 6,                         // subtle depth
  shadowColor: '#E75480',               // shadow color matching button for softer glow
  shadowOpacity: 0.3,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
},
  buttonText: {
    color: '#fff',
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
  },
});

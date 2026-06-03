import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter, useSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RoutineDetailScreen({ route }) {
  const router = useRouter();

  // routine param from props or fallback
  const routine = route?.params?.routine || 'Cleanser';

  const productData = {
    Cleanser: [
      { name: 'Cetaphil Oily Skin Cleanser', image: require('../assets/images/c1.jpg') },
      { name: 'The Ordinary Smoothing Cleanser', image: require('../assets/images/c2.jpg') },
      { name: 'St.Ives Facial Scrub Apricot', image: require('../assets/images/c3.jpg') },
    ],
    Moisturizer: [
      { name: 'Neutrogena Hydro Boost', image: require('../assets/images/most1.webp') },
      { name: 'CeraVe Moisturizing Cream', image: require('../assets/images/most2.webp') },
      { name: 'The Body Shop Vitamin E', image: require('../assets/images/most3.webp') },
    ],
    Sunscreen: [
      { name: 'La Roche-Posay SPF50', image: require('../assets/images/s1.webp') },
    ],
  };

  const products = productData[routine] || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#444" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{routine} Routine</Text>
        <View style={{ width: 28 }} />
      </View>

      <Text style={styles.sectionTitle}>Recommended Products</Text>
      {products.length === 0 ? (
        <Text>No products found.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
          {products.map((prod, index) => (
            <View key={index} style={styles.productCard}>
              <Image source={prod.image} style={styles.productImage} />
              <Text style={styles.productName}>{prod.name}</Text>
              <Ionicons name="star" size={20} color="#F2C94C" style={{ marginTop: 5 }} />
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>Save to your routine</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#FFF9F6', padding:20 },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  headerTitle: { fontSize:22, fontWeight:'bold', color:'#F28BA8' },

  sectionTitle: { fontSize:18, fontWeight:'bold', color:'#444', marginBottom:10 },

  productScroll: { marginBottom:20 },
  productCard: { backgroundColor:'#fff', padding:15, borderRadius:15, marginRight:15, width:140, alignItems:'center', shadowColor:'#000', shadowOpacity:0.05, shadowRadius:5, elevation:3 },
  productImage: { width:100, height:100, borderRadius:10, marginBottom:5 },
  productName: { fontSize:12, fontWeight:'bold', textAlign:'center' },

  saveBtn: { backgroundColor:'#F28BA8', padding:15, borderRadius:30, alignItems:'center', marginBottom:30 },
  saveBtnText: { color:'#fff', fontWeight:'bold', fontSize:16 },
});

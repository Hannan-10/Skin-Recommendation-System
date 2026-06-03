
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; // ✅ Expo Router hooks
import { Ionicons } from '@expo/vector-icons';

const ProductDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams(); // ✅ Params hasil karne ka sahi tareeka
  
  // Stringified product data ko wapis object mein convert karein
  const product = params.product ? JSON.parse(params.product) : null;

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found!</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#E75480" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image source={product.image} style={styles.image} />
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.divider} />
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.description}>{product.description || "No description available."}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1F6' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: '#fff' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollContent: { paddingBottom: 40 },
  imageContainer: { 
    backgroundColor: '#fff', 
    padding: 20, 
    alignItems: 'center', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    elevation: 2 
  },
  image: { width: '100%', height: 300, resizeMode: 'contain' },
  infoCard: { padding: 20, marginTop: 10 },
  name: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  divider: { height: 2, backgroundColor: '#FFD1E1', marginVertical: 15, width: '20%' },
  descriptionTitle: { fontSize: 18, fontWeight: 'bold', color: '#E75480', marginBottom: 8 },
  description: { fontSize: 16, color: '#555', lineHeight: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
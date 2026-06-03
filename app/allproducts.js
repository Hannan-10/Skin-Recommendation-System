import { FlatList, TouchableOpacity, Image, Text, StyleSheet, View, SafeAreaView } from 'react-native';
import products from './data/products';
import { Ionicons } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router'; 

export default function AllProducts() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#E75480" /> 
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Products</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={item => item.id.toString()} // toString() safe side ke liye
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ 
                pathname: '/productdetail', 
                params: { product: JSON.stringify(item) } 
            })}
          >
            <Image source={item.image} style={styles.image} resizeMode="contain"/>
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF1F6' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD1E1',
    marginTop: 10, 
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: { 
    backgroundColor: '#fff', 
    width: '47%', 
    margin: '1.5%', 
    borderRadius: 16, 
    padding: 10,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center' // Image aur text ko center karne ke liye
  },
  image: { 
    width: '100%', 
    height: 120, 
    borderRadius: 12 
  },
  name: { 
    textAlign: 'center', 
    marginTop: 8, 
    fontWeight: '600',
    color: '#444',
    fontSize: 14
  }
});
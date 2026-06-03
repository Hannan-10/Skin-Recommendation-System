import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function StatusModal({
  visible,
  type = 'success',
  title = '',
  message = '',
  primaryLabel = 'OK',
  onPrimary,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.imageWrap}>
            <Image source={require('../../assets/images/logo3.png')} style={styles.image} />
          </View>
          <Text style={[styles.title, type === 'error' && styles.titleError]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onPrimary}>
            <Text style={styles.buttonText}>{primaryLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  imageWrap: {
    position: 'absolute',
    top: -30,
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  image: { width: 60, height: 60, resizeMode: 'contain' },
  title: {
    fontSize: 20,
    color: '#330033',
    fontFamily: 'Nunito-ExtraBold',
    marginTop: 8,
    textAlign: 'center',
  },
  titleError: {
    color: '#E75480',
  },
  message: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#E75480',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#E75480',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
});

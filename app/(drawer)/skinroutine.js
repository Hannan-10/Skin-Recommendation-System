import React from 'react';
import { View, Image, StyleSheet, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '../components/ScreenHeader';

const { width, height } = Dimensions.get('window'); // full screen

// skinroutine.js mein change karein
const skinStepsImages = {
  // Ab path ../../../ se shuru hoga kyunki file 3 folders deep hai
  oily: require('../../assets/images/oilyskincaresteps.png'),
  dry: require('../../assets/images/dryskincaresteps.webp'),
  combination: require('../../assets/images/combinationskinstep.webp'),
};

export default function SkinRoutine() {
  const { skinType } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Skin Routine" />
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={skinStepsImages[skinType]}
          style={styles.image}
          resizeMode="contain"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1F6' },
  content: { paddingHorizontal: 0, paddingBottom: 20 },
  image: {
    width: width,
    height: height - 100, // leave space for header
    borderRadius: 0,
    alignSelf: 'center'
  }
});


// import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
// import { Video } from 'expo-av';
// import { useRouter } from 'expo-router';
// import { useRef, useState } from 'react';

// export default function IntroVideo() {
//   const router = useRouter();
//   const videoRef = useRef(null);
//   const [isPlaying, setIsPlaying] = useState(true); // play/pause state

//   const goNext = () => {
//     router.push('/about');
//   };

//   const togglePlayPause = async () => {
//     if (!videoRef.current) return;

//     const status = await videoRef.current.getStatusAsync();
//     if (status.isPlaying) {
//       videoRef.current.pauseAsync();
//       setIsPlaying(false);
//     } else {
//       videoRef.current.playAsync();
//       setIsPlaying(true);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Video
//         ref={videoRef}
//         source={require('../assets/videos/video.mp4')}
//         style={StyleSheet.absoluteFill}
//         resizeMode="cover"
//         shouldPlay
//         onPlaybackStatusUpdate={(status) => {
//           if (status?.didJustFinish) {
//             goNext();
//           }
//         }}
//       />

//       {/* SKIP */}
//       <TouchableOpacity style={styles.skipBtn} onPress={goNext}>
//         <Text style={styles.skipText}>Skip</Text>
//       </TouchableOpacity>

//       {/* PLAY/PAUSE */}
//       <TouchableOpacity style={styles.pauseBtn} onPress={togglePlayPause}>
//         <Text style={styles.pauseText}>{isPlaying ? 'Pause' : 'Play'}</Text>
//       </TouchableOpacity>

//       {/* NEXT */}
//       <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
//         <Text style={styles.nextText}>Next</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },

//   skipBtn: {
//     position: 'absolute',
//     top: 50,
//     right: 20,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     paddingVertical: 8,
//     paddingHorizontal: 18,
//     borderRadius: 20,
//   },

//   skipText: {
//     color: '#fff',
//     fontSize: 14,
//   },

//   pauseBtn: {
//     position: 'absolute',
//     top: 50,
//     left: 20,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     paddingVertical: 8,
//     paddingHorizontal: 18,
//     borderRadius: 20,
//   },

//   pauseText: {
//     color: '#fff',
//     fontSize: 14,
//   },

//   nextBtn: {
//     position: 'absolute',
//     bottom: 50,
//     right: 20,
//     backgroundColor: '#F28BA8',
//     paddingVertical: 14,
//     paddingHorizontal: 35,
//     borderRadius: 30,
//   },

//   nextText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

export default function IntroVideo() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);

  const goNext = () => {
    if (hasNavigated) return; // Crash se bachne ke liye lock
    setHasNavigated(true);
    // Replace use karne se stack clear ho jata hai aur auto-back nahi hota
    router.replace('/about');
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('../assets/videos/video.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        shouldPlay
        onError={(error) => console.log("Video Error: ", error)}
        onPlaybackStatusUpdate={(status) => {
          // Video khatam hone par automatic next navigation
          if (status.isLoaded && status.didJustFinish && !hasNavigated) {
            goNext();
          }
        }}
      />

      {/* ⏭️ SKIP BUTTON */}
      <TouchableOpacity style={styles.skipBtn} onPress={goNext}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      
      {/* ⏸️ PLAY/PAUSE BUTTON */}
      <TouchableOpacity 
        style={styles.pauseBtn} 
        onPress={() => {
          if (!videoRef.current) return;
          if (isPlaying) videoRef.current.pauseAsync();
          else videoRef.current.playAsync();
          setIsPlaying(!isPlaying);
        }}
      >
        <Text style={styles.pauseText}>{isPlaying ? 'Pause' : 'Play'}</Text>
      </TouchableOpacity>

      {/* ➡️ NEXT BUTTON (Wapis Add Kar Diya) */}
      <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  skipBtn: { 
    position: 'absolute', 
    top: 50, 
    right: 20, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingVertical: 8, 
    paddingHorizontal: 18, 
    borderRadius: 20 
  },
  skipText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito-Regular' },

  pauseBtn: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingVertical: 8, 
    paddingHorizontal: 18, 
    borderRadius: 20 
  },
  pauseText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito-Regular' },

  nextBtn: { 
    position: 'absolute', 
    bottom: 50, 
    right: 20, 
    backgroundColor: '#E75480', // Theme matching pink
    paddingVertical: 14, 
    paddingHorizontal: 35, 
    borderRadius: 30,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Nunito-Bold' }
});

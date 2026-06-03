import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Image, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOutUser } from '../../../firebase/user';

export default function CustomDrawerContent(props) {
  const router = useRouter();

  const routes = [
    { name: '(tabs)', label: 'Home', icon: 'home-outline' },
    { name: 'progress', label: 'My Progress', icon: 'analytics-outline' },
    { name: 'scan', label: 'Scan', icon: 'scan-outline' },
    { name: 'support', label: 'Support', icon: 'help-buoy-outline' },
    { name: 'history', label: 'History', icon: 'time-outline' },
    { name: 'reminders', label: 'Reminders', icon: 'notifications-outline' },
  ];

  const currentRouteName = props?.state?.routeNames?.[props?.state?.index ?? 0];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingVertical: 0 }}>
      {/* Logo */}
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Image
          source={require('../../../assets/images/logo3.png')}
          style={{ width: 140, height: 60, resizeMode: 'contain' }}
        />
      </View>

      {/* Drawer Items */}
      <View style={{ paddingHorizontal: 8 }}>
        {routes.map((r, idx) => (
          <View key={r.name} style={{ marginVertical: 4 }}>
            <DrawerItem
              label={r.label}
              focused={currentRouteName === r.name}
              onPress={() => props.navigation.navigate(r.name)}
              icon={({ color, size }) => <Ionicons name={r.icon} color={color} size={size} />}
              style={{
                borderRadius: 14,
                backgroundColor: currentRouteName === r.name ? '#FFE3ED' : '#fff',
                marginHorizontal: 0,
              }}
              labelStyle={{
                fontWeight: 'bold',
                fontFamily: 'Nunito-Bold',
                color: currentRouteName === r.name ? '#E75480' : '#666',
              }}
            />
            {/* Divider */}
            {idx < routes.length - 1 && (
              <View style={{ height: 1.2, backgroundColor: '#FFD1E1', width: '100%' }} />
            )}
          </View>
        ))}
      </View>

      {/* Sign Out */}
      <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
        <View style={{ height: 1.2, backgroundColor: '#FFD1E1', marginVertical: 8 }} />
        <DrawerItem
          label="Sign Out"
          onPress={async () => { try { await signOutUser(); } catch {} router.replace('/login') }}
          icon={({ color, size }) => <Ionicons name="log-out-outline" color={color} size={size} />}
          labelStyle={{ fontWeight: 'bold', fontFamily: 'Nunito-Bold' }}
          style={{ borderRadius: 14 }}
        />
      </View>

    </DrawerContentScrollView>
  );
}

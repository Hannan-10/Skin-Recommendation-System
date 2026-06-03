// DrawerLayout.js
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from '../components/drawer/CustomDrawerContent';

export default function DrawerLayout() {
  return (
    <Drawer
      id="leftDrawer"
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.35)',
        drawerStyle: { width: 280, borderTopRightRadius: 24, borderBottomRightRadius: 24 },
        drawerActiveTintColor: '#E75480',
        drawerInactiveTintColor: '#666',
        drawerActiveBackgroundColor: '#FFE3ED',
        drawerItemStyle: { borderRadius: 14, marginHorizontal: 8, marginVertical: 4 },
        drawerLabelStyle: { fontWeight: 'bold', fontFamily: 'Nunito-Bold' },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Home',
          title: 'Skinalyst',
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="progress"
        options={{
          drawerLabel: 'My Progress',
          drawerIcon: ({ color, size }) => <Ionicons name="analytics-outline" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="support"
        options={{
          drawerLabel: 'Support',
          drawerIcon: ({ color, size }) => <Ionicons name="help-buoy-outline" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="skinscan"
        options={{
          drawerLabel: 'Scan',
          drawerIcon: ({ color, size }) => <Ionicons name="scan-outline" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          drawerLabel: 'History',
          drawerIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="reminders"
        options={{
          drawerLabel: 'Reminders',
          drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={color} size={size} />,
        }}
      />
    </Drawer>
  );
}

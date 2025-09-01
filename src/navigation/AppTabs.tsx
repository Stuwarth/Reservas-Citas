import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BookingScreen from '../screens/Booking';
import HistoryScreen from '../screens/History';
import SettingsScreen from '../screens/Settings';
import ProvidersScreen from '../screens/Providers';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, string> = {
            Booking: 'event-available',
            History: 'history',
            Settings: 'settings',
            Providers: 'groups',
          };
          const name = map[route.name] ?? 'circle';
          return <Icon name={name} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Booking" component={BookingScreen} options={{ title: 'Reservar' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
      <Tab.Screen name="Providers" component={ProvidersScreen} options={{ title: 'Proveedores' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
}

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { ThemeProvider, useTheme } from './src/theme';

import LoginScreen, { AuthStackParamList } from './src/screens/Login';
import RegisterScreen from './src/screens/Register';
import AppTabs from './src/navigation/AppTabs';
import { seedProvidersIfEmpty } from './src/services/providersService';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator();

function InnerApp() {
  const { colors, isDark } = useTheme();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  // Init notifications: request permission and create a channel
  useEffect(() => {
    (async () => {
      try {
        await notifee.requestPermission();
        await notifee.createChannel({
          id: 'reminders',
          name: 'Recordatorios',
          lights: false,
          vibration: true,
          importance: AndroidImportance.HIGH,
        });
      } catch (e) {
        // noop: en desarrollo puede fallar si no hay servicio de Google
      }
    })();
  }, []);

  // Listener de estado de autenticación
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(current => {
      setUser(current);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  // Seed de proveedores al tener usuario
  useEffect(() => {
    if (user) {
      seedProvidersIfEmpty().catch(() => {});
    }
  }, [user]);

  const isLoggedIn = useMemo(() => !!user, [user]);

  const navTheme = useMemo(() => ({
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.bgMuted,
      card: colors.bg,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '800' as const },
    },
  }), [colors, isDark]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={navTheme as any}>
        {isLoggedIn ? (
          <AppStack.Navigator screenOptions={{ headerShown: false }}>
            <AppStack.Screen name="Tabs" component={AppTabs} />
          </AppStack.Navigator>
        ) : (
          <AuthStack.Navigator>
            <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
            <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
          </AuthStack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <InnerApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({});

export default App;

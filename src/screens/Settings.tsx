import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import auth from '@react-native-firebase/auth';
import notifee from '@notifee/react-native';
import { scheduleAppointmentNotification } from '../lib/notifications';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography, useTheme } from '../theme';

export default function SettingsScreen() {
  const { mode, setMode, colors: dyn } = useTheme();
  const user = auth().currentUser;
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);

  const requestNotif = async () => {
    try {
      setLoadingPerms(true);
      const settings = await notifee.requestPermission();
      Alert.alert('Notificaciones', settings.authorizationStatus ? 'Permisos actualizados' : 'Permisos no otorgados');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo solicitar permisos');
    } finally {
      setLoadingPerms(false);
    }
  };

  const testNotification = async () => {
    try {
      setLoadingTest(true);
      // Programar una notificación de prueba en ~5 segundos (por la lógica de notifications.ts)
      const inOneMinute = new Date(Date.now() + 60 * 1000);
      await scheduleAppointmentNotification('Prueba de notificación', 'Esto es una notificación local de prueba', inOneMinute);
      Alert.alert('Notificación', 'Programada en unos segundos');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo programar la notificación');
    } finally {
      setLoadingTest(false);
    }
  };

  const logout = async () => {
    try {
      setLoadingLogout(true);
      await auth().signOut();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cerrar sesión');
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dyn.bgMuted }] }>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: dyn.text }]}>Ajustes</Text>
          <View style={[styles.card, { backgroundColor: dyn.bg, borderColor: dyn.border }] }>
            <Text style={[styles.label, { color: dyn.textMuted }]}>Correo</Text>
            <Text style={[styles.value, { color: dyn.text }]}>{user?.email ?? '-'}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: dyn.bg, borderColor: dyn.border, marginTop: spacing.lg }] }>
            <Text style={[styles.label, { color: dyn.textMuted, marginBottom: spacing.sm }]}>Tema</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {(['system','light','dark'] as const).map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setMode(opt)}
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: mode === opt ? dyn.primary : dyn.border,
                    backgroundColor: mode === opt ? dyn.primary : dyn.bg,
                    marginRight: spacing.sm,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text style={{ color: mode === opt ? '#fff' : dyn.text }}>
                    {opt === 'system' ? 'Sistema' : opt === 'light' ? 'Claro' : 'Oscuro'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <PrimaryButton title="Permisos de notificaciones" onPress={requestNotif} loading={loadingPerms} style={{ marginTop: spacing.xl }} />
          <PrimaryButton title="Probar notificación" onPress={testNotification} loading={loadingTest} style={{ marginTop: spacing.md }} />
          <PrimaryButton title="Cerrar sesión" onPress={logout} loading={loadingLogout} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, backgroundColor: colors.bgMuted },
  title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.xl },
  card: { backgroundColor: colors.bg, borderRadius: 12, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.textMuted, ...typography.small },
  value: { ...typography.body, marginTop: spacing.xs, color: colors.text },
});

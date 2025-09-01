import React from 'react';
import { View, Text, Button, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { colors, spacing, typography, useTheme } from '../theme';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { colors: c } = useTheme();
  const logout = async () => {
    try {
      await auth().signOut();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cerrar sesión');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bgMuted }]}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: c.text }]}>Bienvenido(a)</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>Base lista. Próximo paso: Reservar Cita e Historial.</Text>
        <View style={{ height: spacing.xl }} />
        <Button title="Reservar Cita" onPress={() => navigation.navigate('Booking')} />
        <View style={{ height: spacing.md }} />
        <Button title="Historial de Citas" onPress={() => navigation.navigate('History')} />
        <View style={{ height: spacing.xl }} />
        <Button title="Cerrar sesión" onPress={logout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { ...typography.h1, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', marginTop: spacing.sm },
});

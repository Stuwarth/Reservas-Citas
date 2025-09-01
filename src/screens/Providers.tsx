import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, typography, useTheme } from '../theme';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { Provider, listProviders, createProvider, deleteProvider } from '../services/providersService';
import EmptyState from '../components/EmptyState';
import { showToast } from '../lib/toast';

export default function ProvidersScreen() {
  const { colors: dyn } = useTheme();
  const [items, setItems] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [duration, setDuration] = useState('30');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const list = await listProviders();
    setItems(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Proveedor', 'Ingresa un nombre');
      return;
    }
    const dur = parseInt(duration, 10) || 30;
    try {
      setSaving(true);
      await createProvider({ name: name.trim(), specialty: specialty.trim() || undefined, durationMinutes: dur });
      setName('');
      setSpecialty('');
      setDuration('30');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteProvider(id);
      await load();
      showToast('Proveedor eliminado');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo eliminar');
    }
  };

  const styles = makeStyles(dyn);

  const renderItem = ({ item }: { item: Provider }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      {!!item.specialty && <Text style={styles.spec}>{item.specialty}</Text>}
      {!!item.durationMinutes && <Text style={styles.spec}>Duración: {item.durationMinutes} min</Text>}
      <View style={{ height: spacing.sm }} />
      <PrimaryButton title="Eliminar" onPress={() => onDelete(item.id)} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={{ paddingTop: spacing.xl }}>
            <ActivityIndicator color={dyn.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            ListHeaderComponent={
              <View>
                <Text style={styles.header}>Proveedores</Text>
                <View style={styles.form}>
                  <TextField label="Nombre" placeholder="Nombre del proveedor" value={name} onChangeText={setName} />
                  <TextField label="Especialidad (opcional)" placeholder="Especialidad" value={specialty} onChangeText={setSpecialty} />
                  <TextField
                    label="Duración estándar (min)"
                    placeholder="30"
                    keyboardType="number-pad"
                    value={duration}
                    onChangeText={setDuration}
                  />
                  <PrimaryButton title={saving ? 'Creando...' : 'Crear proveedor'} onPress={onCreate} disabled={saving} />
                </View>
              </View>
            }
            ListEmptyComponent={<EmptyState title="Sin proveedores" subtitle="Crea tu primer proveedor para empezar" />}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: typeof colors) {
  return StyleSheet.create({
    container: { flex: 1, padding: spacing.xl, backgroundColor: c.bgMuted },
    header: { ...typography.h1, textAlign: 'center', marginBottom: spacing.xl, color: c.text },
    empty: { textAlign: 'center', color: c.textMuted },
    form: { marginBottom: spacing.xl },
    card: {
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      marginBottom: spacing.lg,
      backgroundColor: c.bg,
    },
    name: { ...typography.h2, color: c.text },
    spec: { color: c.textMuted, marginTop: spacing.xs },
  });
}

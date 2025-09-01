import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, ScrollView, RefreshControl, Modal, Animated, Easing } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import { scheduleAppointmentNotification } from '../lib/notifications';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { colors, spacing, typography, useTheme } from '../theme';
import { listProviders, Provider } from '../services/providersService';
import { createAppointment, hasConflict } from '../services/appointmentsService';
import { showToast } from '../lib/toast';
import { useFocusEffect } from '@react-navigation/native';
import { formatDate24 } from '../lib/date';
import EmptyState from '../components/EmptyState';

export default function BookingScreen({ navigation }: any) {
  const { colors: dyn } = useTheme();
  const nextHalfHour = useMemo(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    const mod = d.getMinutes() % 30;
    const add = mod === 0 ? 30 : 30 - mod;
    d.setMinutes(d.getMinutes() + add);
    return d;
  }, []);
  const [date, setDate] = useState<Date>(nextHalfHour);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [duration, setDuration] = useState<number>(30);
  const [refreshing, setRefreshing] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const successScale = React.useRef(new Animated.Value(0.8)).current;
  const successOpacity = React.useRef(new Animated.Value(0)).current;

  const showSuccess = useCallback(() => {
    setSuccessVisible(true);
    Animated.parallel([
      Animated.timing(successScale, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    // Navegar tras un breve delay
    setTimeout(() => {
      setSuccessVisible(false);
      navigation.navigate('History');
    }, 900);
  }, [navigation, successOpacity, successScale]);

  const loadProviders = useCallback(async () => {
    try {
      if (!refreshing) setRefreshing(true);
      const list = await listProviders();
      setProviders(list);
      if (list[0]) {
        setProvider(list[0]);
        setDuration(list[0].durationMinutes ?? 30);
      } else {
        setProvider(null);
      }
    } catch {}
    finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useFocusEffect(
    useCallback(() => {
      loadProviders();
      return () => {};
    }, [loadProviders])
  );

  const onChange = (_: any, selected?: Date) => {
    if (!selected) {
      if (Platform.OS === 'android' && pickerMode === 'date') {
        // cancelled date on Android
        setPickerVisible(false);
      }
      return;
    }

    if (Platform.OS === 'ios') {
      setDate(selected);
    } else {
      if (pickerMode === 'date') {
        // Mantener hora actual, cambiar solo la fecha
        const newDate = new Date(date);
        newDate.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setDate(newDate);
        // Abrir selector de hora
        setPickerMode('time');
        setPickerVisible(true);
      } else {
        // Aplicar hora/minutos sobre la fecha ya seleccionada
        const newDate = new Date(date);
        newDate.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setDate(newDate);
        setPickerVisible(false);
        setPickerMode('date');
      }
    }
  };

  // Safe timeout wrapper to avoid hangs in notification scheduling
  const withTimeout = async <T,>(promise: Promise<T>, ms = 4000): Promise<T | null> => {
    return new Promise(resolve => {
      const t = setTimeout(() => resolve(null), ms);
      promise
        .then(v => {
          clearTimeout(t);
          resolve(v);
        })
        .catch(() => {
          clearTimeout(t);
          resolve(null);
        });
    });
  };

  const save = async () => {
    if (saving) return; // evitar doble envío
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Sesión', 'Debes iniciar sesión.');
      return;
    }
    if (!provider) {
      Alert.alert('Proveedor', 'Selecciona un proveedor.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Motivo', 'Ingresa un motivo para la cita.');
      return;
    }
    try {
      setSaving(true);
      setPickerVisible(false);
      // Validar conflicto
      const conflict = await hasConflict(provider.id, date, duration);
      if (conflict) {
        Alert.alert('Conflicto', 'Ya existe una cita que se solapa con ese horario.');
        setSaving(false);
        return;
      }

      // Intentar agendar notificación, pero no bloquear guardado si tarda
      const notifResult = await withTimeout(
        scheduleAppointmentNotification(
          'Recordatorio de cita',
          `${provider.name} • Motivo: ${reason}`,
          date,
        ),
        4000,
      );

      const payload: any = {
        userId: user.uid,
        providerId: provider.id,
        providerName: provider.name,
        reason,
        start: date,
        durationMinutes: duration,
      };
      if (notifResult?.notifyAt) payload.notifyAt = notifResult.notifyAt;
      if (notifResult?.notificationId) payload.notificationId = notifResult.notificationId;
      await createAppointment(payload);
      showToast('Cita reservada');
      setSaving(false); // desbloquear UI
      showSuccess();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la cita');
    } finally {
      setSaving(false);
    }
  };

  const styles = makeStyles(dyn);
  const formatDate = (d: Date) => formatDate24(d);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProviders} tintColor={dyn.text} />}
        >
          <Text style={styles.title}>Reservar Cita</Text>

      {providers.length === 0 ? (
        <View>
          <EmptyState title="Sin proveedores" subtitle="Crea un proveedor para poder reservar" />
          <View style={{ height: spacing.md }} />
          <PrimaryButton title="Ir a Proveedores" onPress={() => navigation.navigate('Tabs', { screen: 'Providers' })} />
        </View>
      ) : (
        <>
          <Text style={styles.label}>Proveedor</Text>
          <View style={styles.providerRow}>
            {providers.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.pill, provider?.id === p.id && styles.pillActive]}
                onPress={() => {
                  setProvider(p);
                  if (p.durationMinutes) setDuration(p.durationMinutes);
                }}
              >
                <Text style={[styles.pillText, provider?.id === p.id && styles.pillTextActive]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Fecha y hora</Text>
      <PrimaryButton
        title={formatDate(date)}
        onPress={() => {
          if (Platform.OS === 'ios') {
            setPickerVisible(true);
          } else {
            setPickerMode('date');
            setPickerVisible(true);
          }
        }}
      />
      {pickerVisible && (
        Platform.OS === 'ios' ? (
          <DateTimePicker
            value={date}
            mode="datetime"
            onChange={onChange}
            minimumDate={new Date()}
            display="inline"
          />
        ) : (
          <DateTimePicker
            value={date}
            mode={pickerMode}
            onChange={onChange}
            minimumDate={pickerMode === 'date' ? new Date() : undefined}
            is24Hour={true}
            display="default"
          />
        )
      )}

      <Text style={styles.label}>Duración</Text>
      <View style={styles.durationRow}>
        {[30, 45, 60].map(d => (
          <TouchableOpacity key={d} style={[styles.pill, duration === d && styles.pillActive]} onPress={() => setDuration(d)}>
            <Text style={[styles.pillText, duration === d && styles.pillTextActive]}>{d} min</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextField
        label="Motivo"
        placeholder="Describe el motivo de la cita"
        value={reason}
        onChangeText={setReason}
      />

      <PrimaryButton title={saving ? 'Guardando...' : 'Guardar Cita'} onPress={save} disabled={saving} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={() => setSuccessVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: successScale }], opacity: successOpacity, backgroundColor: dyn.bg }] }>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={[styles.successTitle, { color: dyn.text }]}>Cita agendada</Text>
            <Text style={[styles.successSubtitle, { color: dyn.textMuted }]}>Tu cita fue guardada correctamente</Text>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: typeof colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgMuted },
    scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
    title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.xl, color: c.text },
    label: { ...typography.small, color: c.textMuted, marginBottom: spacing.sm, marginTop: spacing.lg },
    providerRow: { flexDirection: 'row', flexWrap: 'wrap' },
    durationRow: { flexDirection: 'row', marginBottom: spacing.lg },
    pill: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    pillActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    pillText: {
      color: c.text,
      fontWeight: '600',
    },
    pillTextActive: {
      color: c.bg,
      fontWeight: '700',
    },
    // Success modal styles
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 16,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    successCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.secondary,
      marginBottom: spacing.md,
    },
    successIcon: {
      color: c.bg,
      fontSize: 36,
      fontWeight: '800',
      lineHeight: 36,
    },
    successTitle: {
      ...typography.h2,
      color: c.text,
      marginTop: spacing.xs,
    },
    successSubtitle: {
      ...typography.small,
      color: c.textMuted,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
  });
}

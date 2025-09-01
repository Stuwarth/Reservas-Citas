import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Platform, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { cancelNotification, scheduleAppointmentNotification } from '../lib/notifications';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography, useTheme } from '../theme';
import { hasConflict, updateAppointment } from '../services/appointmentsService';
import EmptyState from '../components/EmptyState';
import { showToast } from '../lib/toast';
import { formatDate24 } from '../lib/date';

interface AppointmentItem {
  id: string;
  reason: string;
  providerName: string;
  start: Date;
  durationMinutes?: number;
  notifyAt?: Date;
  notificationId?: string;
}

export default function HistoryScreen() {
  const { colors: dyn } = useTheme();
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Reprogramación
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editDuration, setEditDuration] = useState<number>(30);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsub = firestore()
      .collection('appointments')
      .where('userId', '==', uid)
      .orderBy('start', 'desc')
      .onSnapshot(
        snap => {
          const data: AppointmentItem[] = snap.docs.map(d => {
            const v: any = d.data();
            return {
              id: d.id,
              reason: v.reason,
              providerName: v.providerName,
              start: v.start?.toDate?.() ?? new Date(),
              durationMinutes: v.durationMinutes,
              notifyAt: v.notifyAt?.toDate?.(),
              notificationId: v.notificationId,
            };
          });
          setItems(data);
          setLoading(false);
        },
        err => {
          console.error(err);
          setLoading(false);
        },
      );

    return () => unsub();
  }, []);

  const onRefresh = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    try {
      setRefreshing(true);
      const snap = await firestore()
        .collection('appointments')
        .where('userId', '==', uid)
        .orderBy('start', 'desc')
        .get();
      const data: AppointmentItem[] = snap.docs.map(d => {
        const v: any = d.data();
        return {
          id: d.id,
          reason: v.reason,
          providerName: v.providerName,
          start: v.start?.toDate?.() ?? new Date(),
          durationMinutes: v.durationMinutes,
          notifyAt: v.notifyAt?.toDate?.(),
          notificationId: v.notificationId,
        };
      });
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const remove = async (id: string, notificationId?: string) => {
    try {
      await cancelNotification(notificationId);
      await firestore().collection('appointments').doc(id).delete();
      showToast('Cita eliminada');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo eliminar la cita');
    }
  };

  // Reprogramación helpers
  const startEdit = (item: AppointmentItem) => {
    setEditingId(item.id);
    setEditDate(item.start);
    setEditDuration(item.durationMinutes ?? 30);
    setPickerVisible(true);
  };

  const onPickerChange = (_: any, selected?: Date) => {
    if (!selected) {
      if (Platform.OS === 'android' && pickerMode === 'date') setPickerVisible(false);
      return;
    }
    if (Platform.OS === 'ios') {
      setEditDate(selected);
    } else {
      if (pickerMode === 'date') {
        const d = new Date(editDate);
        d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setEditDate(d);
        setPickerMode('time');
        setPickerVisible(true);
      } else {
        const d = new Date(editDate);
        d.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setEditDate(d);
        setPickerVisible(false);
        setPickerMode('date');
      }
    }
  };

  const formatDate = (d: Date) => formatDate24(d);

  const confirmReschedule = async (item: AppointmentItem) => {
    try {
      const doc = await firestore().collection('appointments').doc(item.id).get();
      const v: any = doc.data();
      const providerId: string | undefined = v?.providerId;
      if (!providerId) throw new Error('Proveedor no disponible');

      const conflict = await hasConflict(providerId, editDate, editDuration);
      if (conflict) {
        Alert.alert('Conflicto', 'Ya existe una cita que se solapa con ese horario.');
        return;
      }

      await cancelNotification(item.notificationId);
      const { notificationId, notifyAt } = await scheduleAppointmentNotification(
        'Recordatorio de cita',
        `${item.providerName} • Motivo: ${item.reason}`,
        editDate,
      );

      await updateAppointment(item.id, {
        start: editDate,
        durationMinutes: editDuration,
        notifyAt,
        notificationId,
      });

      showToast('Cita reprogramada');
      setEditingId(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo reprogramar');
    }
  };

  const styles = makeStyles(dyn);

  const renderItem = ({ item }: { item: AppointmentItem }) => (
    <View style={styles.card}>
      <Text style={styles.titleRow}>{item.providerName}</Text>
      <Text style={styles.reason}>{item.reason}</Text>
      <Text style={styles.time}>{formatDate(item.start)} • {item.durationMinutes ?? 30} min</Text>
      {item.notifyAt && <Text style={styles.notify}>Recordatorio: {formatDate(item.notifyAt)}</Text>}

      {editingId === item.id && (
        <View>
          <Text style={styles.sectionLabel}>Nueva fecha y hora</Text>
          <PrimaryButton
            title={formatDate(editDate)}
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
              <DateTimePicker value={editDate} mode="datetime" onChange={onPickerChange} minimumDate={new Date()} display="inline" />
            ) : (
              <DateTimePicker
                value={editDate}
                mode={pickerMode}
                onChange={onPickerChange}
                minimumDate={pickerMode === 'date' ? new Date() : undefined}
                is24Hour={true}
                display="default"
              />
            )
          )}
          <Text style={styles.sectionLabel}>Duración</Text>
          <View style={styles.durationRow}>
            {[30, 45, 60].map(d => (
              <TouchableOpacity key={d} style={[styles.pill, editDuration === d && styles.pillActive]} onPress={() => setEditDuration(d)}>
                <Text style={[styles.pillText, editDuration === d && styles.pillTextActive]}>{d} min</Text>
              </TouchableOpacity>
            ))}
          </View>
          <PrimaryButton title="Confirmar reprogramación" onPress={() => confirmReschedule(item)} />
        </View>
      )}

      <View style={{ height: spacing.sm }} />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title={editingId === item.id ? 'Cancelar' : 'Reprogramar'} onPress={() => (editingId === item.id ? setEditingId(null) : startEdit(item))} />
        </View>
        <View style={{ width: spacing.sm }} />
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Eliminar" onPress={() => remove(item.id, item.notificationId)} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Historial de Citas</Text>
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
          ListEmptyComponent={<EmptyState title="Sin citas" subtitle="Reserva tu primera cita en la pestaña Reservar" />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: typeof colors) {
  return StyleSheet.create({
    container: { flex: 1, padding: spacing.xl, backgroundColor: c.bgMuted },
    header: { ...typography.h1, textAlign: 'center', marginBottom: spacing.xl, color: c.text },
    empty: { textAlign: 'center', color: c.textMuted, ...typography.body },
    card: {
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      marginBottom: spacing.lg,
      backgroundColor: c.bg,
    },
    titleRow: { ...typography.h2, color: c.text },
    reason: { color: c.textMuted, marginTop: spacing.xs },
    time: { color: c.textMuted, marginTop: spacing.xs },
    notify: { color: c.textMuted, marginTop: spacing.xs },
    sectionLabel: { ...typography.small, color: c.textMuted, marginTop: spacing.md, marginBottom: spacing.sm },
    durationRow: { flexDirection: 'row', marginBottom: spacing.lg },
    pill: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    pillActive: { backgroundColor: c.primary, borderColor: c.primary },
    pillText: { color: c.text },
    pillTextActive: { color: '#fff' },
  });
}

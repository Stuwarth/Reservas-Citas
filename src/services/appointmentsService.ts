import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';

export interface CreateAppointmentInput {
  userId: string;
  providerId: string;
  providerName: string;
  reason: string;
  start: Date;
  durationMinutes: number;
  notifyAt: Date;
  notificationId: string;
}

export interface AppointmentDoc {
  userId: string;
  providerId: string;
  providerName: string;
  reason: string;
  start: FirebaseFirestoreTypes.Timestamp;
  end: FirebaseFirestoreTypes.Timestamp;
  durationMinutes: number;
  day: string; // yyyy-MM-dd para filtrar por día
  notifyAt: FirebaseFirestoreTypes.Timestamp;
  notificationId: string;
  createdAt: FirebaseFirestoreTypes.FieldValue;
}

const col = () => firestore().collection('appointments');

function toDayKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function hasConflict(providerId: string, start: Date, durationMinutes: number): Promise<boolean> {
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const dayKey = toDayKey(start);
  // Buscar todas las citas del proveedor en ese día y validar overlap en memoria
  const snap = await col().where('providerId', '==', providerId).where('day', '==', dayKey).get();
  for (const d of snap.docs) {
    const v: any = d.data();
    const aStart: Date = v.start?.toDate?.() ?? new Date();
    const aEnd: Date = v.end?.toDate?.() ?? new Date();
    const overlap = aStart < end && aEnd > start; // solapa
    if (overlap) return true;
  }
  return false;
}

export async function createAppointment(input: CreateAppointmentInput) {
  const { userId, providerId, providerName, reason, start, durationMinutes, notifyAt, notificationId } = input;
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const dayKey = toDayKey(start);

  const data: AppointmentDoc = {
    userId,
    providerId,
    providerName,
    reason: reason.trim(),
    start: firestore.Timestamp.fromDate(start),
    end: firestore.Timestamp.fromDate(end),
    durationMinutes,
    day: dayKey,
    notifyAt: firestore.Timestamp.fromDate(notifyAt),
    notificationId,
    createdAt: firestore.FieldValue.serverTimestamp(),
  } as any;

  await col().add(data as any);
}

export async function updateAppointment(
  id: string,
  updates: {
    start: Date;
    durationMinutes: number;
    notifyAt: Date;
    notificationId: string;
  },
) {
  const { start, durationMinutes, notifyAt, notificationId } = updates;
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const dayKey = toDayKey(start);

  await col()
    .doc(id)
    .update({
      start: firestore.Timestamp.fromDate(start),
      end: firestore.Timestamp.fromDate(end),
      durationMinutes,
      day: dayKey,
      notifyAt: firestore.Timestamp.fromDate(notifyAt),
      notificationId,
    });
}

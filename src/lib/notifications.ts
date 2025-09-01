import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';

export async function ensureChannel() {
  await notifee.createChannel({ id: 'reminders', name: 'Recordatorios', importance: AndroidImportance.HIGH });
}

export async function scheduleAppointmentNotification(title: string, body: string, scheduledAt: Date) {
  await ensureChannel();
  // Calcular 15 minutos antes
  const notifyAt = new Date(scheduledAt.getTime() - 15 * 60 * 1000);
  const now = Date.now();
  // Si el tiempo ya pasó (para pruebas), dispara en 5 segundos
  const fireTime = notifyAt.getTime() <= now ? now + 5000 : notifyAt.getTime();

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireTime,
    alarmManager: { allowWhileIdle: true },
  };

  const id = await notifee.createTriggerNotification(
    {
      title,
      body,
      android: { channelId: 'reminders', smallIcon: 'ic_launcher' },
    },
    trigger,
  );

  return { notificationId: id, notifyAt: new Date(fireTime) };
}

export async function cancelNotification(id?: string) {
  if (!id) return;
  try {
    await notifee.cancelNotification(id);
  } catch {}
}

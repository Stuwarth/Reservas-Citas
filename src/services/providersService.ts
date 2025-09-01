import firestore from '@react-native-firebase/firestore';

export interface Provider {
  id: string;
  name: string;
  specialty?: string;
  durationMinutes?: number; // duración recomendada por proveedor
}

const col = () => firestore().collection('providers');

export async function seedProvidersIfEmpty() {
  const snap = await col().limit(1).get();
  if (!snap.empty) return;
  const seeds: Omit<Provider, 'id'>[] = [
    { name: 'Clínica Central', specialty: 'Medicina General', durationMinutes: 30 },
    { name: 'Dra. López', specialty: 'Odontología', durationMinutes: 60 },
    { name: 'Centro Bienestar', specialty: 'Fisioterapia', durationMinutes: 45 },
  ];
  const batch = firestore().batch();
  seeds.forEach(s => {
    const ref = col().doc();
    batch.set(ref, s);
  });
  await batch.commit();
}

export async function listProviders(): Promise<Provider[]> {
  const snap = await col().get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function createProvider(input: Omit<Provider, 'id'>) {
  await col().add(input);
}

export async function deleteProvider(id: string) {
  await col().doc(id).delete();
}

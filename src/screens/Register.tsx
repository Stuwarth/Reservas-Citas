import React from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import auth from '@react-native-firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './Login';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography, useTheme } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type FormValues = { email: string; password: string; confirm: string };

const schema = yup.object({
  email: yup.string().email('Email inválido').required('Email requerido'),
  password: yup
    .string()
    .min(6, 'Mínimo 6 caracteres')
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Debe contener letras y números')
    .required('Contraseña requerida'),
  confirm: yup
    .string()
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

export default function RegisterScreen({ navigation }: Props) {
  const { colors: c } = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: yupResolver(schema), defaultValues: { email: '', password: '', confirm: '' } });

  const onSubmit = async ({ email, password }: FormValues) => {
    try {
      await auth().createUserWithEmailAndPassword(email.trim(), password);
      // Redirige el listener de App.tsx
    } catch (e: any) {
      Alert.alert('Error al registrar', e?.message ?? 'Intenta de nuevo');
    }
  };

  const styles = makeStyles(c);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgMuted }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Crear cuenta</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Email"
              placeholder="correo@ejemplo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIconName="email"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              secureToggle
              leftIconName="lock"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              secureTextEntry
              secureToggle
              leftIconName="lock"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.confirm?.message}
            />
          )}
        />

          <PrimaryButton title={isSubmitting ? 'Creando...' : 'Crear cuenta'} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} />
          <View style={{ height: spacing.lg }} />
          <PrimaryButton title="Ya tengo cuenta" onPress={() => navigation.navigate('Login')} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: typeof colors) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center', backgroundColor: c.bgMuted },
    title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.xl, color: c.text },
  });
}

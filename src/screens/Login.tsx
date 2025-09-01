import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import auth from '@react-native-firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography, useTheme } from '../theme';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

type FormValues = { email: string; password: string };

const schema = yup.object({
  email: yup.string().email('Email inválido').required('Email requerido'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña requerida'),
});

export default function LoginScreen({ navigation }: Props) {
  const { colors: c } = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }: FormValues) => {
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
      // El listener de auth en App.tsx hará la redirección
    } catch (e: any) {
      Alert.alert('Error al iniciar sesión', e?.message ?? 'Intenta de nuevo');
    }
  };

  const styles = makeStyles(c);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgMuted }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: spacing.xxl }]} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Iniciar sesión</Text>

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
              placeholder="Tu contraseña"
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

          <PrimaryButton title={isSubmitting ? 'Ingresando...' : 'Ingresar'} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} />
          <View style={{ height: spacing.lg }} />
          <PrimaryButton title="Crear cuenta" onPress={() => navigation.navigate('Register')} />
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

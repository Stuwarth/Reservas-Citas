import React, { useMemo, useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, typography, useTheme } from '../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftIconName?: string;
  rightIconName?: string;
  onPressRightIcon?: () => void;
  secureToggle?: boolean; // if true and secureTextEntry provided, shows eye icon to toggle
}

export default function TextField({ label, error, style, leftIconName, rightIconName, onPressRightIcon, secureToggle, secureTextEntry, ...rest }: Props) {
  const { colors: c } = useTheme();
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const styles = useMemo(() => makeStyles(c), [c]);

  const showEye = !!secureToggle && !!secureTextEntry;
  const rightIcon = showEye ? (hidden ? 'visibility-off' : 'visibility') : rightIconName;

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputRow}>
        {leftIconName ? (
          <Icon name={leftIconName as any} size={20} color={c.textMuted} style={styles.leftIcon} />
        ) : null}
        <TextInput
          style={[styles.input, !!error && styles.inputError, style as any]}
          placeholderTextColor={c.textMuted}
          secureTextEntry={hidden}
          {...rest}
        />
        {rightIcon ? (
          <TouchableOpacity
            onPress={() => {
              if (showEye) setHidden(h => !h);
              else onPressRightIcon?.();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name={rightIcon as any} size={20} color={c.textMuted} style={styles.rightIcon} />
          </TouchableOpacity>
        ) : null}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function makeStyles(c: typeof colors) {
  return StyleSheet.create({
    wrapper: { marginBottom: spacing.lg },
    label: { ...typography.small, color: c.textMuted, marginBottom: spacing.sm },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      backgroundColor: c.bg,
    },
    leftIcon: { marginLeft: spacing.md },
    rightIcon: { marginRight: spacing.md },
    input: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      color: c.text,
    },
    inputError: { borderColor: c.danger },
    error: { color: c.danger, marginTop: spacing.xs, ...typography.small },
  });
}

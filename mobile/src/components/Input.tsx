import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftPrefix?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftPrefix,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focusedWrapper,
          error ? styles.errorWrapper : null,
          props.multiline ? styles.multilineWrapper : null,
        ]}
      >
        {leftPrefix ? (
          <View style={styles.prefixContainer}>
            <Text style={styles.prefixText}>{leftPrefix}</Text>
          </View>
        ) : null}

        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, leftPrefix ? { paddingLeft: 8 } : null, inputStyle]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  multilineWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  focusedWrapper: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  errorWrapper: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  prefixContainer: {
    marginRight: 4,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    height: '100%',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});

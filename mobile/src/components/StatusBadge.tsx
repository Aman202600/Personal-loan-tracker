import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { LoanStatus } from '../types';

interface StatusBadgeProps {
  status: LoanStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'repaid':
        return {
          label: 'Repaid',
          bg: colors.successLight,
          text: colors.successDark,
          icon: 'checkmark-circle' as const,
        };
      case 'overdue':
        return {
          label: 'Overdue',
          bg: colors.dangerLight,
          text: colors.dangerDark,
          icon: 'alert-circle' as const,
        };
      case 'partially repaid':
        return {
          label: 'Partially Repaid',
          bg: colors.infoLight,
          text: colors.infoDark,
          icon: 'pie-chart' as const,
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          bg: colors.warningLight,
          text: colors.warningDark,
          icon: 'time' as const,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={13} color={config.text} style={styles.icon} />
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

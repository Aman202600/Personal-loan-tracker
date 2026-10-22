import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { IDashboardSummary } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SummaryCardProps {
  summary: IDashboardSummary | null;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const outstanding = summary?.outstandingAmount || 0;
  const totalLent = summary?.totalLent || 0;
  const totalRepaid = summary?.totalRepaid || 0;
  const overdue = summary?.overdueAmount || 0;
  const activeCount = summary?.activeLoansCount || 0;
  const repaidCount = summary?.repaidLoansCount || 0;

  return (
    <View style={styles.container}>
      {/* Primary Highlight Header: Outstanding Balance */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>Total Outstanding Balance</Text>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>{activeCount} Active</Text>
          </View>
        </View>

        <Text style={styles.heroAmount}>{formatCurrency(outstanding)}</Text>

        <View style={styles.heroFooter}>
          <Text style={styles.settledText}>
            {repaidCount} {repaidCount === 1 ? 'loan' : 'loans'} fully settled
          </Text>
        </View>
      </View>

      {/* Grid of Key Sub-Metrics */}
      <View style={styles.grid}>
        {/* Total Lent */}
        <View style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="cash-outline" size={18} color={colors.accent} />
          </View>
          <Text style={styles.metricLabel}>Total Lent</Text>
          <Text style={styles.metricValue}>{formatCurrency(totalLent)}</Text>
        </View>

        {/* Total Repaid */}
        <View style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-done" size={18} color={colors.successDark} />
          </View>
          <Text style={styles.metricLabel}>Total Repaid</Text>
          <Text style={[styles.metricValue, { color: colors.successDark }]}>
            {formatCurrency(totalRepaid)}
          </Text>
        </View>
      </View>

      {/* Overdue Alert Strip (if overdue > 0) */}
      {overdue > 0 ? (
        <View style={styles.overdueBanner}>
          <View style={styles.overdueLeft}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.overdueTitle}>Overdue Amount Alert</Text>
              <Text style={styles.overdueSubtitle}>Attention needed on due loans</Text>
            </View>
          </View>
          <Text style={styles.overdueAmount}>{formatCurrency(overdue)}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroLabel: {
    fontSize: 13,
    color: '#CCFBF1',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  heroFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 8,
  },
  settledText: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  overdueBanner: {
    marginTop: 12,
    backgroundColor: colors.dangerLight,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overdueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dangerDark,
  },
  overdueSubtitle: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 1,
  },
  overdueAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dangerDark,
  },
});

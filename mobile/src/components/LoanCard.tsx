import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { ILoan } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate, getRelativeDueDateText } from '../utils/formatters';

interface LoanCardProps {
  loan: ILoan;
  onPress: () => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({ loan, onPress }) => {
  const isOverdue = loan.status === 'overdue';
  const isRepaid = loan.status === 'repaid';

  // Calculate percentage repaid for progress bar
  const progressPercent =
    loan.amount > 0 ? Math.min(100, Math.round((loan.amountRepaid / loan.amount) * 100)) : 0;

  // Extract friend's initials
  const initials = loan.friendName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const dueInfo = getRelativeDueDateText(loan.dueDate, loan.status);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        isOverdue && styles.overdueCard,
        isRepaid && styles.repaidCard,
      ]}
    >
      {/* Top Header: Friend Info & Status */}
      <View style={styles.header}>
        <View style={styles.friendInfo}>
          <View style={[styles.avatar, isOverdue ? styles.avatarOverdue : null]}>
            <Text style={[styles.avatarText, isOverdue ? styles.avatarTextOverdue : null]}>
              {initials}
            </Text>
          </View>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.friendName} numberOfLines={1}>
              {loan.friendName}
            </Text>
            <Text style={styles.lentDate}>Lent on {formatDate(loan.dateLent)}</Text>
          </View>
        </View>

        <StatusBadge status={loan.status} />
      </View>

      {/* Middle Amount Breakdown */}
      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.amountLabel}>Outstanding</Text>
          <Text
            style={[
              styles.outstandingAmount,
              isOverdue && { color: colors.dangerDark },
              isRepaid && { color: colors.successDark },
            ]}
          >
            {formatCurrency(loan.outstandingBalance)}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amountLabel}>Original Loan</Text>
          <Text style={styles.originalAmount}>{formatCurrency(loan.amount)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${progressPercent}%` },
              isOverdue
                ? { backgroundColor: colors.danger }
                : isRepaid
                ? { backgroundColor: colors.success }
                : { backgroundColor: colors.primary },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progressPercent}% repaid</Text>
      </View>

      {/* Bottom Footer: Due Date & Note Indicator */}
      <View style={styles.footer}>
        <View style={styles.dueContainer}>
          <Text
            style={[
              styles.dueText,
              dueInfo.isOverdue && styles.dueTextOverdue,
              isRepaid && styles.dueTextSettled,
            ]}
          >
            {dueInfo.text} • Due {formatDate(loan.dueDate)}
          </Text>
        </View>

        {loan.receiptPath ? (
          <View style={styles.receiptBadge}>
            <Text style={styles.receiptBadgeText}>📷 Receipt</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  overdueCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  repaidCard: {
    borderColor: '#D1FAE5',
    opacity: 0.92,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverdue: {
    backgroundColor: colors.dangerLight,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  avatarTextOverdue: {
    color: colors.dangerDark,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lentDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  outstandingAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  originalAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressContainer: {
    marginVertical: 10,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
  },
  dueContainer: {
    flex: 1,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dueTextOverdue: {
    color: colors.dangerDark,
    fontWeight: '700',
  },
  dueTextSettled: {
    color: colors.successDark,
  },
  receiptBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  receiptBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

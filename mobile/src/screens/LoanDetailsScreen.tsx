import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import { loansApi } from '../api/loans';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ILoan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
  formatCurrency,
  formatDate,
  getRelativeDueDateText,
} from '../utils/formatters';

type LoanDetailsRouteProp = RouteProp<RootStackParamList, 'LoanDetails'>;
type LoanDetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'LoanDetails'>;

export const LoanDetailsScreen: React.FC = () => {
  const route = useRoute<LoanDetailsRouteProp>();
  const navigation = useNavigation<LoanDetailsNavProp>();
  const { loanId } = route.params;
  const { token } = useAuth();

  const [loan, setLoan] = useState<ILoan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Repayment form state
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayNotes, setRepayNotes] = useState<string>('');
  const [repaying, setRepaying] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Full-screen image modal
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  const receiptUrl = loan?.receiptPath
    ? loan.receiptPath.startsWith('http') ||
      loan.receiptPath.startsWith('blob:') ||
      loan.receiptPath.startsWith('data:')
      ? loan.receiptPath
      : `${API_BASE_URL}/loans/${loan._id}/receipt?token=${token}`
    : null;

  const fetchLoanDetails = useCallback(async () => {
    try {
      const data = await loansApi.getLoanById(loanId);
      setLoan(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load loan details.');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  // Quick repayment amount selection
  const handleQuickAmount = (fraction: number) => {
    if (!loan) return;
    const calculated = Math.round(loan.outstandingBalance * fraction * 100) / 100;
    setRepayAmount(calculated.toString());
  };

  const handleRepaymentSubmit = async () => {
    const num = parseFloat(repayAmount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid repayment amount greater than ₹0.');
      return;
    }

    if (loan && num > loan.outstandingBalance) {
      Alert.alert(
        'Amount Exceeded',
        `Repayment amount cannot exceed the remaining balance (${formatCurrency(
          loan.outstandingBalance
        )}).`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmAndExecuteRepayment = async () => {
    setShowConfirmModal(false);
    setRepaying(true);
    try {
      const updated = await loansApi.recordRepayment(loanId, {
        amount: parseFloat(repayAmount),
        notes: repayNotes.trim(),
      });
      setLoan(updated);
      setRepayAmount('');
      setRepayNotes('');
      Alert.alert('Success', 'Repayment successfully recorded!');
    } catch (err: any) {
      Alert.alert('Repayment Failed', err.message || 'Could not record repayment.');
    } finally {
      setRepaying(false);
    }
  };

  const handleDeleteLoan = () => {
    Alert.alert(
      'Delete Loan',
      `Are you sure you want to delete the loan for ${loan?.friendName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await loansApi.deleteLoan(loanId);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete loan.');
            }
          },
        },
      ]
    );
  };

  // Upload or replace receipt
  const handleUploadReceipt = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const updated = await loansApi.uploadReceipt(loanId, uri);
        setLoan(updated);
        Alert.alert('Success', 'Receipt attached successfully.');
      }
    } catch {
      Alert.alert('Error', 'Unable to upload receipt image.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerText}>Loading loan details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !loan) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.centerText}>{error || 'Loan entry not found'}</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
      </SafeAreaView>
    );
  }

  const isOverdue = loan.status === 'overdue';
  const isRepaid = loan.status === 'repaid';
  const dueInfo = getRelativeDueDateText(loan.dueDate, loan.status);
  const progressPercent =
    loan.amount > 0 ? Math.min(100, Math.round((loan.amountRepaid / loan.amount) * 100)) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <TouchableOpacity onPress={handleDeleteLoan} style={styles.iconButton}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Friend Summary Banner */}
        <View style={[styles.mainCard, isOverdue ? styles.mainCardOverdue : null]}>
          <View style={styles.friendRow}>
            <View style={[styles.avatar, isOverdue ? styles.avatarOverdue : null]}>
              <Text style={[styles.avatarText, isOverdue ? styles.avatarTextOverdue : null]}>
                {loan.friendName.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.friendName}>{loan.friendName}</Text>
              <Text style={styles.dateSubtext}>Lent on {formatDate(loan.dateLent)}</Text>
            </View>
            <StatusBadge status={loan.status} />
          </View>

          {/* Amount Grid */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Remaining Outstanding Balance</Text>
            <Text
              style={[
                styles.balanceAmount,
                isOverdue && { color: colors.dangerDark },
                isRepaid && { color: colors.successDark },
              ]}
            >
              {formatCurrency(loan.outstandingBalance)}
            </Text>

            {/* Progress Bar */}
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

            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>Original Loan</Text>
                <Text style={styles.statValue}>{formatCurrency(loan.amount)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statLabel}>Already Repaid</Text>
                <Text style={[styles.statValue, { color: colors.successDark }]}>
                  {formatCurrency(loan.amountRepaid)} ({progressPercent}%)
                </Text>
              </View>
            </View>
          </View>

          {/* Due Date Alert Strip */}
          <View
            style={[
              styles.dueStrip,
              isOverdue && styles.dueStripOverdue,
              isRepaid && styles.dueStripSettled,
            ]}
          >
            <Ionicons
              name={isOverdue ? 'alert-circle' : isRepaid ? 'checkmark-circle' : 'calendar'}
              size={18}
              color={isOverdue ? colors.dangerDark : isRepaid ? colors.successDark : colors.textSecondary}
            />
            <Text
              style={[
                styles.dueStripText,
                isOverdue && styles.dueStripTextOverdue,
                isRepaid && styles.dueStripTextSettled,
              ]}
            >
              {dueInfo.text} • Due {formatDate(loan.dueDate)}
            </Text>
          </View>

          {/* Notes (if any) */}
          {loan.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes / Purpose:</Text>
              <Text style={styles.notesContent}>{loan.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Repayment Form (if balance remains) */}
        {!isRepaid ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Record a Repayment</Text>
            <Text style={styles.sectionSubtitle}>
              Log a partial or full repayment for this loan entry.
            </Text>

            {/* Quick Presets */}
            <View style={styles.quickPresetRow}>
              <TouchableOpacity
                style={styles.quickPresetBtn}
                onPress={() => handleQuickAmount(0.25)}
              >
                <Text style={styles.quickPresetText}>25%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickPresetBtn}
                onPress={() => handleQuickAmount(0.5)}
              >
                <Text style={styles.quickPresetText}>50%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickPresetBtn, styles.quickPresetFull]}
                onPress={() => handleQuickAmount(1.0)}
              >
                <Text style={[styles.quickPresetText, { color: colors.primaryDark }]}>
                  Pay Full ({formatCurrency(loan.outstandingBalance)})
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Repayment Amount (₹) *"
              placeholder="Enter amount"
              value={repayAmount}
              onChangeText={setRepayAmount}
              keyboardType="numeric"
              leftPrefix="₹"
            />

            <Input
              label="Optional Note"
              placeholder="e.g. Paid via Google Pay / Cash / Bank Transfer"
              value={repayNotes}
              onChangeText={setRepayNotes}
            />

            <Button
              title="Record Repayment"
              onPress={handleRepaymentSubmit}
              loading={repaying}
              variant="primary"
              size="lg"
            />
          </View>
        ) : (
          <View style={styles.fullySettledBox}>
            <Ionicons name="checkmark-done-circle" size={36} color={colors.success} />
            <Text style={styles.fullySettledTitle}>Loan Fully Settled</Text>
            <Text style={styles.fullySettledSubtitle}>
              All ₹{loan.amount} has been completely repaid.
            </Text>
          </View>
        )}

        {/* Repayment History Timeline */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Repayment History</Text>
          {loan.repayments.length === 0 ? (
            <Text style={styles.noRepaymentsText}>No repayments recorded yet.</Text>
          ) : (
            loan.repayments.map((rep, idx) => (
              <View key={rep._id || idx} style={styles.repaymentRow}>
                <View style={styles.repaymentIcon}>
                  <Ionicons name="arrow-down" size={16} color={colors.successDark} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.repaymentAmount}>+ {formatCurrency(rep.amount)}</Text>
                  {rep.notes ? <Text style={styles.repaymentNote}>{rep.notes}</Text> : null}
                  <Text style={styles.repaymentDate}>{formatDate(rep.date)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Receipt Photo Attachment Section */}
        <View style={styles.sectionCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.sectionTitle}>Receipt Photo</Text>
            <TouchableOpacity onPress={handleUploadReceipt}>
              <Text style={styles.attachReceiptText}>
                {loan.receiptPath ? 'Change Photo' : '+ Attach Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {loan.receiptPath ? (
            <TouchableOpacity
              onPress={() => setShowImageModal(true)}
              activeOpacity={0.8}
              style={styles.receiptPreviewTouch}
            >
              <Image
                source={{ uri: receiptUrl || loan.receiptPath }}
                style={styles.attachedImage}
                defaultSource={{ uri: 'https://placehold.co/400x250?text=Receipt+Attached' }}
              />
              <View style={styles.viewFullImageRow}>
                <Ionicons name="scan-outline" size={15} color={colors.primary} />
                <Text style={styles.viewFullImageText}>Tap to view full receipt</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.noRepaymentsText}>No receipt photo attached for this loan.</Text>
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal for Repayment */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="help-circle" size={36} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Confirm Repayment</Text>
            <Text style={styles.modalText}>
              Are you sure you want to record a repayment of{' '}
              <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
                {formatCurrency(parseFloat(repayAmount) || 0)}
              </Text>{' '}
              from {loan.friendName}?
            </Text>

            <View style={styles.modalButtonRow}>
              <Button
                title="Cancel"
                onPress={() => setShowConfirmModal(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Confirm"
                onPress={confirmAndExecuteRepayment}
                variant="primary"
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Lightbox Modal for Full Receipt View */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.lightboxOverlay}>
          <View style={styles.lightboxCard}>
            {/* Lightbox Header */}
            <View style={styles.lightboxHeader}>
              <View style={styles.lightboxTitleGroup}>
                <Ionicons name="document-text" size={20} color={colors.primaryLight} style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.lightboxTitle}>Receipt Photo</Text>
                  <Text style={styles.lightboxSubtitle}>
                    {loan.friendName} • {formatCurrency(loan.amount)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                style={styles.lightboxCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Lightbox Image Preview */}
            <View style={styles.lightboxImageContainer}>
              {receiptUrl ? (
                <Image
                  source={{ uri: receiptUrl }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.lightboxNoImage}>
                  <Ionicons name="image-outline" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                    Receipt photo is unavailable.
                  </Text>
                </View>
              )}
            </View>

            {/* Lightbox Footer Actions */}
            <View style={styles.lightboxFooter}>
              {receiptUrl ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(receiptUrl)}
                  style={styles.lightboxOpenLink}
                  activeOpacity={0.7}
                >
                  <Ionicons name="open-outline" size={16} color={colors.primaryLight} />
                  <Text style={styles.lightboxOpenLinkText}>Open Full Size</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <Button
                title="Done"
                onPress={() => setShowImageModal(false)}
                variant="primary"
                size="sm"
                style={{ minWidth: 90 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  mainCardOverdue: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverdue: {
    backgroundColor: colors.dangerLight,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  avatarTextOverdue: {
    color: colors.dangerDark,
  },
  friendName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dateSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  balanceSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  dueStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dueStripOverdue: {
    backgroundColor: colors.dangerLight,
  },
  dueStripSettled: {
    backgroundColor: colors.successLight,
  },
  dueStripText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  dueStripTextOverdue: {
    color: colors.dangerDark,
    fontWeight: '700',
  },
  dueStripTextSettled: {
    color: colors.successDark,
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
    marginTop: 2,
  },
  quickPresetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickPresetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickPresetFull: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  quickPresetText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fullySettledBox: {
    backgroundColor: colors.successLight,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  fullySettledTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.successDark,
    marginTop: 6,
  },
  fullySettledSubtitle: {
    fontSize: 13,
    color: colors.successDark,
    marginTop: 2,
  },
  repaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  repaymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repaymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  repaymentNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  repaymentDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  noRepaymentsText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  attachReceiptText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  attachedImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  receiptPreviewTouch: {
    width: '100%',
    alignItems: 'center',
  },
  viewFullImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  viewFullImageText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
  },
  // Lightbox Modal Styles
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  lightboxCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lightboxTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lightboxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lightboxSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  lightboxCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  lightboxImageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxNoImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  lightboxOpenLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  lightboxOpenLinkText: {
    fontSize: 13,
    color: colors.primaryLight,
    fontWeight: '600',
  },
});

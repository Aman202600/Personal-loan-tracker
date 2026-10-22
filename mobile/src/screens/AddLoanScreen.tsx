import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import { loansApi } from '../api/loans';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

type AddLoanNavProp = NativeStackNavigationProp<RootStackParamList, 'AddLoan'>;

export const AddLoanScreen: React.FC = () => {
  const navigation = useNavigation<AddLoanNavProp>();

  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dateLent, setDateLent] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Quick Due Date Presets
  const applyPreset = (days: number) => {
    const base = new Date(dateLent);
    base.setDate(base.getDate() + days);
    setDueDate(base.toISOString().split('T')[0]);
    if (errors.dueDate) {
      setErrors((prev) => ({ ...prev, dueDate: '' }));
    }
  };

  // Pick receipt image
  const pickReceipt = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Permission Error', 'Unable to access photo library.');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!friendName.trim()) {
      newErrors.friendName = "Friend's name is required";
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid loan amount greater than ₹0';
    }

    if (!dateLent) {
      newErrors.dateLent = 'Date lent is required';
    }

    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const lentTime = new Date(dateLent).getTime();
      const dueTime = new Date(dueDate).getTime();
      if (dueTime < lentTime) {
        newErrors.dueDate = 'Due date must be on or after the date lent';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const createdLoan = await loansApi.createLoan({
        friendName: friendName.trim(),
        amount: parseFloat(amount),
        dateLent: new Date(dateLent).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        notes: notes.trim(),
      });

      // Upload receipt if user picked one
      if (receiptUri) {
        try {
          await loansApi.uploadReceipt(createdLoan._id, receiptUri);
        } catch (uploadErr) {
          console.warn('Receipt upload failed, loan was created:', uploadErr);
        }
      }

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create loan entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Loan Entry</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {/* Friend Name */}
            <Input
              label="Friend's Full Name *"
              placeholder="e.g. Rahul Sharma"
              value={friendName}
              onChangeText={(text) => {
                setFriendName(text);
                if (errors.friendName) setErrors((prev) => ({ ...prev, friendName: '' }));
              }}
              error={errors.friendName}
              autoFocus
            />

            {/* Loan Amount in INR */}
            <Input
              label="Loan Amount in INR (₹) *"
              placeholder="5,000"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              keyboardType="numeric"
              leftPrefix="₹"
              error={errors.amount}
            />

            {/* Date Lent */}
            <Input
              label="Date Lent (YYYY-MM-DD) *"
              placeholder="YYYY-MM-DD"
              value={dateLent}
              onChangeText={(text) => {
                setDateLent(text);
                if (errors.dateLent) setErrors((prev) => ({ ...prev, dateLent: '' }));
              }}
              error={errors.dateLent}
            />

            {/* Due Date */}
            <Input
              label="Due Date (YYYY-MM-DD) *"
              placeholder="YYYY-MM-DD"
              value={dueDate}
              onChangeText={(text) => {
                setDueDate(text);
                if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: '' }));
              }}
              error={errors.dueDate}
            />

            {/* Due Date Quick Presets */}
            <Text style={styles.presetLabel}>Quick Presets:</Text>
            <View style={styles.presetsRow}>
              {[
                { label: '+1 Week', days: 7 },
                { label: '+15 Days', days: 15 },
                { label: '+1 Month', days: 30 },
                { label: '+3 Months', days: 90 },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={styles.presetChip}
                  onPress={() => applyPreset(preset.days)}
                >
                  <Text style={styles.presetChipText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional Notes */}
            <Input
              label="Optional Notes / Reason"
              placeholder="e.g., Concert tickets, split trip expenses, emergency aid..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            {/* Optional Receipt Attachment */}
            <Text style={styles.sectionSubhead}>Optional Receipt Photo</Text>
            {receiptUri ? (
              <View style={styles.receiptPreviewContainer}>
                <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                <TouchableOpacity
                  style={styles.removeReceiptButton}
                  onPress={() => setReceiptUri(null)}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                  <Text style={styles.removeReceiptText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={pickReceipt}>
                <Ionicons name="camera-outline" size={28} color={colors.primary} />
                <Text style={styles.uploadText}>Attach Photo Receipt / UPI Screenshot</Text>
                <Text style={styles.uploadSubtext}>Supports JPG, PNG up to 5MB</Text>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                onPress={() => navigation.goBack()}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Save Loan"
                onPress={handleSave}
                loading={loading}
                variant="primary"
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: -8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionSubhead: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
    marginTop: 6,
  },
  uploadSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  receiptPreviewContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  removeReceiptButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeReceiptText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});

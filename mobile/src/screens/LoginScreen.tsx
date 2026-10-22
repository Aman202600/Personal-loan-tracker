import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { requestOtp, verifyOtp } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    setError(null);
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const fullPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${cleaned}`;

    setLoading(true);
    try {
      await requestOtp(fullPhoneNumber);
      setStep('otp');
      setCountdown(45);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const cleanedOtp = otp.trim();
    if (cleanedOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code');
      return;
    }

    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    const fullPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${cleaned}`;

    setLoading(true);
    try {
      await verifyOtp(fullPhoneNumber, cleanedOtp);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoIconContainer}>
              <Ionicons name="wallet" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>MiniLedger</Text>
            <Text style={styles.brandSubtitle}>Personal Loan & Credit Tracker</Text>
            <Text style={styles.brandCaption}>
              Keep track of money lent to friends, monitor due dates, and record repayments effortlessly.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {step === 'phone' ? (
              <View>
                <Text style={styles.stepTitle}>Enter Your Mobile Number</Text>
                <Text style={styles.stepSubtitle}>
                  We will send a 6-digit verification code to authenticate your account.
                </Text>

                <Input
                  label="Mobile Number"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChangeText={(val) => {
                    setPhoneNumber(val);
                    if (error) setError(null);
                  }}
                  keyboardType="phone-pad"
                  maxLength={13}
                  leftPrefix="+91"
                  autoFocus
                />

                <Button
                  title="Send Verification Code"
                  onPress={handleSendOtp}
                  loading={loading}
                  variant="primary"
                  size="lg"
                  style={styles.actionButton}
                />
              </View>
            ) : (
              <View>
                <View style={styles.otpHeaderRow}>
                  <Text style={styles.stepTitle}>Enter 6-Digit OTP</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setStep('phone');
                      setOtp('');
                      setError(null);
                    }}
                  >
                    <Text style={styles.changePhoneText}>Change Number</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.stepSubtitle}>
                  Code sent to <Text style={{ fontWeight: '700' }}>{phoneNumber}</Text>
                </Text>

                <Input
                  label="Verification Code"
                  placeholder="123456"
                  value={otp}
                  onChangeText={(val) => {
                    setOtp(val);
                    if (error) setError(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  inputStyle={styles.otpInput}
                  autoFocus
                />

                <Button
                  title="Verify & Continue"
                  onPress={handleVerifyOtp}
                  loading={loading}
                  variant="primary"
                  size="lg"
                  style={styles.actionButton}
                />

                {/* Resend OTP */}
                <View style={styles.resendContainer}>
                  {countdown > 0 ? (
                    <Text style={styles.resendTimerText}>
                      Resend code in <Text style={{ fontWeight: '700' }}>{countdown}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                      <Text style={styles.resendLink}>Resend Verification Code</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Mock OTP Helper Card */}
            <View style={styles.mockInfoCard}>
              <View style={styles.mockInfoHeader}>
                <Ionicons name="information-circle" size={18} color={colors.accent} />
                <Text style={styles.mockInfoTitle}>Development Mock OTP</Text>
              </View>
              <Text style={styles.mockInfoText}>
                Check your backend server terminal to view the printed OTP, or use default developer code{' '}
                <Text style={styles.mockCodeHighlight}>123456</Text>.
              </Text>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  brandCaption: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 320,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changePhoneText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.dangerDark,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendTimerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  resendLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  mockInfoCard: {
    marginTop: 24,
    backgroundColor: colors.accentLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  mockInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mockInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentDark,
    marginLeft: 6,
  },
  mockInfoText: {
    fontSize: 12,
    color: '#3730A3',
    lineHeight: 17,
  },
  mockCodeHighlight: {
    fontWeight: '800',
    color: colors.accentDark,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 4,
  },
});

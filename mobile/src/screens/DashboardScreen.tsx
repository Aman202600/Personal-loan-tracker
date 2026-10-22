import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import { loansApi } from '../api/loans';
import { summaryApi } from '../api/summary';
import { ILoan, IDashboardSummary } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { LoanCard } from '../components/LoanCard';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

type DashboardNavProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

type FilterTab = 'all' | 'active' | 'overdue' | 'repaid';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState<IDashboardSummary | null>(null);
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [summaryData, loansData] = await Promise.all([
        summaryApi.getSummary(),
        loansApi.getLoans(),
      ]);
      setSummary(summaryData);
      setLoans(loansData);
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh on focus when navigating back from AddLoan or LoanDetails
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter & Search logic
  const filteredLoans = loans.filter((loan) => {
    // Search match
    const matchesSearch = loan.friendName
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());

    if (!matchesSearch) return false;

    // Tab match
    if (selectedTab === 'all') return true;
    if (selectedTab === 'active') return loan.status !== 'repaid';
    if (selectedTab === 'overdue') return loan.status === 'overdue';
    if (selectedTab === 'repaid') return loan.status === 'repaid';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Ionicons name="wallet" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.appTitle}>MiniLedger</Text>
            <Text style={styles.userPhone}>{user?.phoneNumber || 'My Account'}</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main Content / FlatList */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your loans...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={54} color={colors.danger} />
          <Text style={styles.errorTitle}>Connection Problem</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <Button title="Try Again" onPress={fetchData} variant="primary" style={{ width: 140 }} />
        </View>
      ) : (
        <FlatList
          data={filteredLoans}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Dashboard Summary Card */}
              <SummaryCard summary={summary} />

              {/* Action Bar: Add Loan Button */}
              <View style={styles.actionRow}>
                <Text style={styles.sectionHeading}>Your Loans</Text>
                <Button
                  title="+ New Loan"
                  onPress={() => navigation.navigate('AddLoan')}
                  variant="primary"
                  size="sm"
                  style={styles.addButton}
                />
              </View>

              {/* Search Box */}
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                  placeholder="Search friend's name..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  clearButtonMode="while-editing"
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Filter Tabs */}
              <View style={styles.tabsContainer}>
                {(['all', 'active', 'overdue', 'repaid'] as FilterTab[]).map((tab) => {
                  const isActive = selectedTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setSelectedTab(tab)}
                      style={[styles.tabButton, isActive && styles.tabButtonActive]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          isActive && styles.tabTextActive,
                          tab === 'overdue' && !isActive ? { color: colors.danger } : null,
                        ]}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onPress={() => navigation.navigate('LoanDetails', { loanId: item._id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={searchQuery ? 'No matching friends found' : 'No loans recorded yet'}
              description={
                searchQuery
                  ? `No entries match "${searchQuery}". Try a different name or clear the filter.`
                  : 'Start tracking personal money lent to friends, monitor due dates, and record repayments.'
              }
              buttonTitle={searchQuery ? 'Clear Search' : '+ Record First Loan'}
              onButtonPress={() => {
                if (searchQuery) {
                  setSearchQuery('');
                } else {
                  navigation.navigate('AddLoan');
                }
              }}
            />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userPhone: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
    marginBottom: 6,
  },
  errorDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addButton: {
    borderRadius: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});

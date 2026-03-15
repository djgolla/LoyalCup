// Rewards/Loyalty screen
// universal-coffee-shop/app/rewards.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getGlobalPoints, getAllShopPoints, getPointsHistory } from '../services/loyaltyService';

export default function RewardsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalPoints, setGlobalPoints] = useState(null);
  const [shopPoints, setShopPoints] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview | history

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [global, shops, history] = await Promise.all([
        getGlobalPoints(user.id),
        getAllShopPoints(user.id),
        getPointsHistory(user.id, 20)
      ]);

      setGlobalPoints(global);
      setShopPoints(shops);
      setTransactions(history);
    } catch (error) {
      console.error('Failed to load rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTotalPoints = () => {
    const global = globalPoints?.current_balance || 0;
    const shopTotal = shopPoints.reduce((sum, sp) => sum + (sp.current_balance || 0), 0);
    return global + shopTotal;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Feather name="award" size={24} color="#FFF" />
            <Text style={styles.pointsLabel}>LOYALTY POINTS</Text>
          </View>
          <Text style={styles.pointsValue}>{getTotalPoints()}</Text>
          <Text style={styles.pointsSubtext}>Keep earning to unlock more rewards!</Text>
        </View>

        {/* Global Points */}
        {globalPoints && globalPoints.current_balance > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Global Points</Text>
            <View style={styles.balanceCard}>
              <View>
                <Text style={styles.balanceName}>Universal Points</Text>
                <Text style={styles.balanceSubtext}>Use at any shop</Text>
              </View>
              <Text style={styles.balancePoints}>{globalPoints.current_balance} pts</Text>
            </View>
          </View>
        )}

        {/* Shop Balances */}
        {shopPoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Points</Text>
            {shopPoints.map((balance) => (
              <View key={balance.id} style={styles.balanceCard}>
                <View>
                  <Text style={styles.balanceName}>
                    {balance.shop?.name || 'Unknown Shop'}
                  </Text>
                  <Text style={styles.balanceSubtext}>Shop-specific rewards</Text>
                </View>
                <Text style={styles.balancePoints}>{balance.current_balance} pts</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{globalPoints?.total_earned || 0}</Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{globalPoints?.total_spent || 0}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Feather name="info" size={20} color="#00704A" />
              <Text style={styles.infoText}>
                Earn 10 points per $1 spent at any shop. Redeem 100 points for $1 off!
              </Text>
            </View>
          </View>
        )}

        {/* Transaction History */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="clock" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No transaction history yet</Text>
                <Text style={styles.emptySubtext}>Start earning points by placing orders!</Text>
              </View>
            ) : (
              transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionIcon}>
                    <Feather 
                      name={transaction.type === 'earned' ? 'arrow-down-right' : 'arrow-up-right'} 
                      size={20} 
                      color={transaction.type === 'earned' ? '#00704A' : '#EF4444'} 
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description || transaction.type}
                    </Text>
                    <Text style={styles.transactionShop}>
                      {transaction.shop?.name || 'LoyalCup'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.created_at)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionPoints,
                      transaction.amount > 0 ? styles.pointsEarned : styles.pointsSpent
                    ]}
                  >
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  pointsCard: {
    backgroundColor: '#00704A',
    margin: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  pointsLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  pointsValue: {
    color: '#FFF',
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pointsSubtext: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  balancePoints: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00704A',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#00704A',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#FFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00704A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#00704A',
    lineHeight: 20,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  transactionShop: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionPoints: {
    fontSize: 18,
    fontWeight: '700',
  },
  pointsEarned: {
    color: '#00704A',
  },
  pointsSpent: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});
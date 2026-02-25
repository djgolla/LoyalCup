// Rewards/Loyalty screen
// universal-coffee-shop/app/rewards.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { loyaltyService } from '../services/loyaltyService';

export default function RewardsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [points, setPoints] = useState(0);
  const [balances, setBalances] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('rewards'); // rewards | history

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pointsData, rewardsData, transactionsData] = await Promise.all([
        loyaltyService.getPoints(),
        loyaltyService.getRewards(),
        loyaltyService.getTransactions(),
      ]);
      
      setPoints(pointsData.points || 0);
      setBalances(pointsData.balances || []);
      setRewards(rewardsData);
      setTransactions(transactionsData.slice(0, 20)); // Last 20 transactions
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

  const handleRedeemReward = async (rewardId, pointsRequired) => {
    if (points < pointsRequired) {
      alert('Not enough points to redeem this reward');
      return;
    }

    try {
      await loyaltyService.redeemPoints(pointsRequired, rewardId);
      alert('Reward redeemed successfully!');
      loadData();
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      alert('Failed to redeem reward. Please try again.');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
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
          <Feather name="arrow-left" size={24} color="black" />
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
          <Text style={styles.pointsLabel}>TOTAL POINTS</Text>
          <Text style={styles.pointsValue}>{points}</Text>
          <Text style={styles.pointsSubtext}>Keep earning to unlock more rewards!</Text>
        </View>

        {/* Shop Balances */}
        {balances.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Balances</Text>
            {balances.map((balance) => (
              <View key={balance.id} style={styles.balanceCard}>
                <Text style={styles.balanceName}>
                  {balance.shops?.name || 'Global Loyalty'}
                </Text>
                <Text style={styles.balancePoints}>{balance.points} pts</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rewards' && styles.tabActive]}
            onPress={() => setActiveTab('rewards')}
          >
            <Text style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>
              Available Rewards
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

        {/* Available Rewards */}
        {activeTab === 'rewards' && (
          <View style={styles.section}>
            {rewards.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="gift" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No rewards available yet</Text>
              </View>
            ) : (
              rewards.map((reward) => {
                const canRedeem = points >= reward.points_required;
                return (
                  <View key={reward.id} style={styles.rewardCard}>
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardName}>{reward.name}</Text>
                      <Text style={styles.rewardDescription}>{reward.description}</Text>
                      <Text style={styles.rewardShop}>
                        {reward.shops?.name || 'LoyalCup'}
                      </Text>
                    </View>
                    <View style={styles.rewardAction}>
                      <Text style={styles.rewardPoints}>{reward.points_required} pts</Text>
                      <TouchableOpacity
                        style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}
                        onPress={() => handleRedeemReward(reward.id, reward.points_required)}
                        disabled={!canRedeem}
                      >
                        <Text style={[styles.redeemButtonText, !canRedeem && styles.redeemButtonTextDisabled]}>
                          {canRedeem ? 'Redeem' : 'Locked'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Transaction History */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="clock" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No transaction history yet</Text>
              </View>
            ) : (
              transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Text>
                    <Text style={styles.transactionShop}>
                      {transaction.shops?.name || 'LoyalCup'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.created_at)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionPoints,
                      transaction.points_change > 0 ? styles.pointsEarned : styles.pointsSpent
                    ]}
                  >
                    {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Anton-Regular',
  },
  content: {
    flex: 1,
  },
  pointsCard: {
    backgroundColor: '#000',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  pointsLabel: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Anton-Regular',
    letterSpacing: 2,
    marginBottom: 10,
  },
  pointsValue: {
    color: '#FFF',
    fontSize: 64,
    fontFamily: 'Anton-Regular',
  },
  pointsSubtext: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Anton-Regular',
    marginBottom: 15,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 10,
  },
  balanceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  balancePoints: {
    fontSize: 16,
    fontFamily: 'Anton-Regular',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 25,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Anton-Regular',
    color: '#000',
  },
  tabTextActive: {
    color: '#FFF',
  },
  rewardCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 15,
    marginBottom: 10,
  },
  rewardInfo: {
    flex: 1,
    marginRight: 15,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  rewardShop: {
    fontSize: 12,
    color: '#999',
  },
  rewardAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rewardPoints: {
    fontSize: 16,
    fontFamily: 'Anton-Regular',
    marginBottom: 10,
  },
  redeemButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#000',
    borderRadius: 20,
  },
  redeemButtonDisabled: {
    backgroundColor: '#CCC',
  },
  redeemButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Anton-Regular',
  },
  redeemButtonTextDisabled: {
    color: '#666',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 10,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  transactionShop: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionPoints: {
    fontSize: 20,
    fontFamily: 'Anton-Regular',
  },
  pointsEarned: {
    color: '#22C55E',
  },
  pointsSpent: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
});

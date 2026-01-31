import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LEAGUES } from '../utils/constants';

// Get gradient colors based on league
const getLeagueGradient = (leagueId) => {
  switch (leagueId) {
    case 'bronze':
      return ['#CD7F32', '#8B4513', '#CD7F32'];
    case 'silver':
      return ['#C0C0C0', '#808080', '#C0C0C0'];
    case 'gold':
      return ['#FFD700', '#FFA500', '#FFD700'];
    case 'platinum':
      return ['#E5E4E2', '#A8A8A8', '#E5E4E2'];
    case 'diamond':
      return ['#B9F2FF', '#87CEEB', '#B9F2FF'];
    default:
      return ['#333', '#222', '#333'];
  }
};

export function LeagueCard({ league, coins, onPress }) {
  const canAfford = coins >= league.entryFee;
  const isUnlocked = coins >= league.minCoins || league.id === 'bronze';
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        !canAfford && styles.disabled,
      ]}
      onPress={onPress}
      disabled={!canAfford}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={getLeagueGradient(league.id)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.innerCard}>
          <View style={styles.leftSection}>
            <Text style={styles.leagueEmoji}>
              {league.id === 'diamond' ? '💎' : 
               league.id === 'platinum' ? '⚪' :
               league.id === 'gold' ? '🏆' :
               league.id === 'silver' ? '🥈' : '🥉'}
            </Text>
          </View>
          
          <View style={styles.centerSection}>
            <Text style={styles.leagueName}>{league.name.toUpperCase()}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Ingresso</Text>
                <Text style={styles.statValue}>🪙 {league.entryFee}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Premio</Text>
                <Text style={[styles.statValue, styles.rewardValue]}>🪙 {league.reward}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.rightSection}>
            <View style={[styles.playButton, !canAfford && styles.playButtonDisabled]}>
              <Text style={styles.playButtonText}>{canAfford ? '▶' : '🔒'}</Text>
            </View>
          </View>
        </View>
        
        {!canAfford && (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedText}>Monete insufficienti</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function LeagueBadge({ leagueId }) {
  const league = LEAGUES.find((l) => l.id === leagueId) || LEAGUES[0];
  
  return (
    <View style={[styles.badge, { backgroundColor: league.color }]}>
      <Text style={styles.badgeText}>{league.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  disabled: {
    opacity: 0.6,
  },
  gradientContainer: {
    borderRadius: 20,
    padding: 3,
  },
  innerCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 100,
  },
  leftSection: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  leagueEmoji: {
    fontSize: 32,
  },
  centerSection: {
    flex: 1,
  },
  leagueName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rewardValue: {
    color: '#4CAF50',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#444',
    marginHorizontal: 15,
  },
  rightSection: {
    marginLeft: 10,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#c0392b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#c0392b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  playButtonDisabled: {
    backgroundColor: '#444',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  lockedOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  lockedText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
});

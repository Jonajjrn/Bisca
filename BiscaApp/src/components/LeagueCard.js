import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LEAGUES, COLORS } from '../utils/constants';

// Get gradient colors based on league
const getLeagueGradient = (leagueId) => {
  switch (leagueId) {
    case 'bronze':
      return ['#CD7F32', '#8B4513'];
    case 'silver':
      return ['#C0C0C0', '#808080'];
    case 'gold':
      return ['#FFD700', '#FFA500'];
    case 'platinum':
      return ['#E5E4E2', '#A8A8A8'];
    case 'diamond':
      return ['#B9F2FF', '#87CEEB'];
    default:
      return ['#333', '#222'];
  }
};

const getLeagueIcon = (leagueId) => {
  switch (leagueId) {
    case 'bronze': return '☕';
    case 'silver': return '🥈';
    case 'gold': return '🏆';
    case 'platinum': return '💎';
    case 'diamond': return '👑';
    default: return '🎴';
  }
};

export function LeagueCard({ league, coins, onPress }) {
  const canAfford = coins >= league.entryFee;
  
  return (
    <TouchableOpacity
      style={[styles.container, !canAfford && styles.disabled]}
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
            <Text style={styles.leagueEmoji}>{getLeagueIcon(league.id)}</Text>
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
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  gradientContainer: {
    borderRadius: 24,
    padding: 3,
  },
  innerCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    minHeight: 110,
  },
  leftSection: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  leagueEmoji: {
    fontSize: 34,
  },
  centerSection: {
    flex: 1,
  },
  leagueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 2,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  rewardValue: {
    color: COLORS.success,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  rightSection: {
    marginLeft: 12,
  },
  playButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.denari,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.denari,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonDisabled: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  playButtonText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  lockedOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  lockedText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
});

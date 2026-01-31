import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LEAGUES } from '../utils/constants';

export function LeagueCard({ league, coins, onPress }) {
  const canAfford = coins >= league.entryFee;
  const isUnlocked = coins >= league.minCoins || league.id === 'bronze';
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderColor: league.color },
        !canAfford && styles.disabled,
      ]}
      onPress={onPress}
      disabled={!canAfford}
      activeOpacity={0.7}
    >
      <View style={[styles.header, { backgroundColor: league.color }]}>
        <Text style={styles.leagueName}>{league.name}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Ingresso:</Text>
          <Text style={styles.value}>🪙 {league.entryFee}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Premio:</Text>
          <Text style={[styles.value, styles.reward]}>🪙 {league.reward}</Text>
        </View>
        
        {!canAfford && (
          <Text style={styles.lockedText}>Monete insufficienti</Text>
        )}
      </View>
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
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 12,
    borderWidth: 2,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    padding: 12,
    alignItems: 'center',
  },
  leagueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  content: {
    padding: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  label: {
    color: '#888',
    fontSize: 14,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reward: {
    color: '#4CAF50',
  },
  lockedText: {
    color: '#ff5555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
});

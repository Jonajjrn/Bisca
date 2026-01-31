import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { LeagueBadge } from '../components/LeagueCard';
import { getPlayerLeague } from '../utils/storage';

export default function HomeScreen({ navigation }) {
  const { playerData, loading } = useGame();

  if (loading) {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={styles.loadingContainer}
      >
        <Text style={styles.loadingText}>Caricamento...</Text>
      </LinearGradient>
    );
  }

  const currentLeague = getPlayerLeague(playerData.coins);
  const winRate = playerData.gamesPlayed > 0
    ? Math.round((playerData.gamesWon / playerData.gamesPlayed) * 100)
    : 0;

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Decorative Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      
      {/* Title Section */}
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.cardEmoji}>🃏</Text>
          <View>
            <Text style={styles.title}>BISCA</Text>
            <Text style={styles.subtitle}>DICTATOR EDITION</Text>
          </View>
          <Text style={styles.cardEmoji}>🃏</Text>
        </View>
      </View>

      {/* Player Card */}
      <View style={styles.playerCard}>
        <LinearGradient
          colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)', 'rgba(0,0,0,0.3)']}
          style={styles.playerCardGradient}
        >
          <View style={styles.playerHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{playerData.name}</Text>
              <LeagueBadge leagueId={currentLeague.id} />
            </View>
            <View style={styles.coinsContainer}>
              <Text style={styles.coinsEmoji}>🪙</Text>
              <Text style={styles.coinsValue}>{playerData.coins}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{playerData.gamesWon}</Text>
              <Text style={styles.statLabel}>Vittorie</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{playerData.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Partite</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: winRate >= 50 ? '#4CAF50' : '#ff6b6b' }]}>
                {winRate}%
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Main Action Button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => navigation.navigate('LeagueSelect')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#c0392b', '#e74c3c', '#c0392b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.playButtonGradient}
        >
          <Text style={styles.playButtonIcon}>🎴</Text>
          <Text style={styles.playButtonText}>GIOCA ORA</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Secondary Buttons */}
      <View style={styles.secondaryRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Tutorial')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryIcon}>📖</Text>
          <Text style={styles.secondaryText}>Tutorial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryIcon}>⚙️</Text>
          <Text style={styles.secondaryText}>Opzioni</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(192, 57, 43, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: '#c0392b',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 4,
    marginTop: 5,
    textAlign: 'center',
  },
  playerCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  playerCardGradient: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    padding: 20,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  coinsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  coinsEmoji: {
    fontSize: 24,
  },
  coinsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    paddingVertical: 15,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  playButton: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#c0392b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 12,
  },
  playButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  playButtonIcon: {
    fontSize: 28,
  },
  playButtonText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    maxWidth: 320,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  secondaryText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  version: {
    position: 'absolute',
    bottom: 25,
    color: '#444',
    fontSize: 12,
  },
});

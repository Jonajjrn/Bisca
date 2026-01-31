import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { LeagueBadge } from '../components/LeagueCard';
import { getPlayerLeague } from '../utils/storage';

export default function HomeScreen({ navigation }) {
  const { playerData, loading } = useGame();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }

  const currentLeague = getPlayerLeague(playerData.coins);
  const winRate = playerData.gamesPlayed > 0
    ? Math.round((playerData.gamesWon / playerData.gamesPlayed) * 100)
    : 0;

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f0f23']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>BISCA</Text>
        <Text style={styles.subtitle}>DICTATOR EDITION</Text>
      </View>

      {/* Player Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.playerName}>{playerData.name}</Text>
          <LeagueBadge leagueId={currentLeague.id} />
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🪙 {playerData.coins}</Text>
            <Text style={styles.statLabel}>Monete</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{playerData.gamesWon}</Text>
            <Text style={styles.statLabel}>Vittorie</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
        </View>
      </View>

      {/* Main Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => navigation.navigate('LeagueSelect')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8b0000', '#c0392b']}
            style={styles.playButtonGradient}
          >
            <Text style={styles.playButtonText}>GIOCA</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Tutorial')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>📖 TUTORIAL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>⚙️ IMPOSTAZIONI</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#c0392b',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
    letterSpacing: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    letterSpacing: 3,
    marginTop: 5,
  },
  statsCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  playButton: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#c0392b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  playButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
  },
  secondaryButton: {
    width: '100%',
    padding: 15,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  secondaryButtonText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  version: {
    position: 'absolute',
    bottom: 20,
    color: '#555',
    fontSize: 12,
  },
});

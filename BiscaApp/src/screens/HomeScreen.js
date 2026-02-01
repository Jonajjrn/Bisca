import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { LeagueBadge } from '../components/LeagueCard';
import { getPlayerLeague } from '../utils/storage';
import { COLORS, LEAGUES } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { playerData, loading } = useGame();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }

  const currentLeague = getPlayerLeague(playerData.coins);
  const winRate = playerData.gamesPlayed > 0
    ? Math.round((playerData.gamesWon / playerData.gamesPlayed) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with profile and notifications */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.profileEmoji}>{playerData.avatar || '🎴'}</Text>
        </TouchableOpacity>
        
        <View style={styles.coinsDisplay}>
          <Text style={styles.coinsValue}>{playerData.coins.toLocaleString()}</Text>
          <Text style={styles.coinsLabel}>🪙</Text>
        </View>
      </View>

      {/* Main Score Display */}
      <View style={styles.scoreSection}>
        <Text style={styles.scoreNumber}>{playerData.gamesWon}</Text>
        <Text style={styles.scoreLabel}>Livello: {currentLeague.name}</Text>
      </View>

      {/* League Cards Carousel */}
      <Text style={styles.sectionTitle}>Tavoli Disponibili</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH * 0.75 + 15}
      >
        {LEAGUES.map((league, index) => {
          const canAfford = playerData.coins >= league.entryFee;
          const gradients = [
            ['#667eea', '#764ba2'],
            ['#11998e', '#38ef7d'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#fa709a', '#fee140'],
          ];
          
          return (
            <TouchableOpacity
              key={league.id}
              style={[styles.leagueCard, !canAfford && styles.leagueCardLocked]}
              onPress={() => canAfford && navigation.navigate('LeagueSelect')}
              disabled={!canAfford}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradients[index % gradients.length]}
                style={styles.leagueCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.leagueCardHeader}>
                  <Text style={styles.leagueIcon}>
                    {index === 0 ? '☕' : index === 1 ? '🌋' : index === 2 ? '👑' : index === 3 ? '💎' : '🌟'}
                  </Text>
                  {!canAfford && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
                
                <Text style={styles.leagueCardTitle}>{league.name}</Text>
                <Text style={styles.leagueCardSubtitle}>
                  Buy-in {league.entryFee} • Premio {league.reward}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Play Button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => navigation.navigate('LeagueSelect')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={COLORS.gradientPurple}
          style={styles.playButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.playButtonIcon}>🎴</Text>
          <Text style={styles.playButtonText}>GIOCA ORA</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{playerData.gamesPlayed}</Text>
          <Text style={styles.statLabel}>Partite</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: winRate >= 50 ? COLORS.success : COLORS.danger }]}>
            {winRate}%
          </Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <TouchableOpacity onPress={() => navigation.navigate('Tutorial')}>
            <Text style={styles.statNumber}>📖</Text>
            <Text style={styles.statLabel}>Regole</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Tutorial')}>
          <Text style={styles.navIcon}>📚</Text>
          <Text style={styles.navText}>Tutorial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemCenter]} onPress={() => navigation.navigate('LeagueSelect')}>
          <View style={styles.navCenterButton}>
            <Text style={styles.navCenterIcon}>🎴</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navText}>Opzioni</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  profileEmoji: {
    fontSize: 26,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: 8,
  },
  coinsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.denari,
  },
  coinsLabel: {
    fontSize: 18,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  scoreLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  leagueCard: {
    width: SCREEN_WIDTH * 0.75,
    height: 160,
    marginRight: 15,
    borderRadius: 24,
    overflow: 'hidden',
  },
  leagueCardLocked: {
    opacity: 0.5,
  },
  leagueCardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  leagueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueIcon: {
    fontSize: 32,
  },
  lockIcon: {
    fontSize: 20,
  },
  leagueCardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  leagueCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  playButton: {
    marginHorizontal: 20,
    marginTop: 25,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  playButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  playButtonIcon: {
    fontSize: 26,
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    marginHorizontal: 20,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.glassBorder,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.denari,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    paddingTop: 15,
    paddingBottom: 35,
    paddingHorizontal: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navItemCenter: {
    marginTop: -35,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  navCenterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.denari,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.denari,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  navCenterIcon: {
    fontSize: 28,
  },
});

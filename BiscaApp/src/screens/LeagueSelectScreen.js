import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { LeagueCard } from '../components/LeagueCard';
import { LEAGUES, COLORS } from '../utils/constants';

export default function LeagueSelectScreen({ navigation }) {
  const { playerData, setCurrentLeague, deductCoins, gameSettings } = useGame();

  const handleLeagueSelect = async (league) => {
    // Show confirmation dialog before starting the game
    Alert.alert(
      'Conferma Partita',
      `Vuoi giocare nella lega ${league.name}?\n\nIngresso: 🪙 ${league.entryFee}\nPremio: 🪙 ${league.reward}`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Gioca!',
          onPress: async () => {
            const success = await deductCoins(league.entryFee);
            if (success) {
              setCurrentLeague(league.id);
              navigation.navigate('Game', { league: league.id });
            } else {
              Alert.alert('Monete insufficienti', 'Non hai abbastanza monete per questo tavolo.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Indietro</Text>
        </TouchableOpacity>
        
        <View style={styles.coinsDisplay}>
          <Text style={styles.coinsText}>🪙 {playerData.coins}</Text>
        </View>
      </View>

      <Text style={styles.title}>SELEZIONA TAVOLO</Text>
      <Text style={styles.subtitle}>Scegli la lega in cui vuoi giocare</Text>

      {/* League List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {LEAGUES.map((league) => (
          <LeagueCard
            key={league.id}
            league={league}
            coins={playerData.coins}
            onPress={() => handleLeagueSelect(league)}
          />
        ))}
      </ScrollView>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          💡 Leghe più alte = Premi maggiori!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  coinsDisplay: {
    backgroundColor: COLORS.glass,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.denari,
  },
  coinsText: {
    color: COLORS.denari,
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  infoText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { COLORS, AVATAR_OPTIONS } from '../utils/constants';

export default function SettingsScreen({ navigation }) {
  const { playerData, updatePlayerData, gameSettings, setGameSettings } = useGame();
  const [name, setName] = useState(playerData.name);
  const [selectedAvatar, setSelectedAvatar] = useState(
    AVATAR_OPTIONS.find(a => a.emoji === playerData.avatar) || AVATAR_OPTIONS[0]
  );

  const handleSave = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Errore', 'Il nome deve avere almeno 2 caratteri');
      return;
    }
    
    await updatePlayerData({ 
      name: name.trim().toUpperCase(),
      avatar: selectedAvatar.emoji,
    });
    Alert.alert('Salvato!', 'Le impostazioni sono state aggiornate.');
  };

  const updateGameSetting = (key, value) => {
    setGameSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetProgress = () => {
    Alert.alert(
      'Reset Progressi',
      'Sei sicuro di voler azzerare tutti i tuoi progressi? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await updatePlayerData({
              coins: 50,
              gamesPlayed: 0,
              gamesWon: 0,
              highestLeague: 'bronze',
            });
            Alert.alert('Reset completato', 'I tuoi progressi sono stati azzerati.');
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
      </View>

      <Text style={styles.title}>IMPOSTAZIONI</Text>

      {/* Player Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nome Giocatore</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={12}
          placeholder="Il tuo nome"
          placeholderTextColor="#666"
        />
      </View>

      {/* Game Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Impostazioni Partita</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Numero di Avversari</Text>
          <View style={styles.optionButtons}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.optionButton,
                  gameSettings.botCount === num && styles.optionButtonActive,
                ]}
                onPress={() => updateGameSetting('botCount', num)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    gameSettings.botCount === num && styles.optionButtonTextActive,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Vite Iniziali</Text>
          <View style={styles.optionButtons}>
            {[1, 3, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.optionButton,
                  styles.optionButtonWide,
                  gameSettings.lives === num && styles.optionButtonActive,
                ]}
                onPress={() => updateGameSetting('lives', num)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    gameSettings.lives === num && styles.optionButtonTextActive,
                  ]}
                >
                  {num === 1 ? '1 (Sudden)' : num === 3 ? '3 (Standard)' : '5 (Maratona)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Carte Massime</Text>
          <View style={styles.optionButtons}>
            {[3, 4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.optionButton,
                  gameSettings.maxCards === num && styles.optionButtonActive,
                ]}
                onPress={() => updateGameSetting('maxCards', num)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    gameSettings.maxCards === num && styles.optionButtonTextActive,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>SALVA IMPOSTAZIONI</Text>
      </TouchableOpacity>

      {/* Reset Section */}
      <View style={styles.dangerSection}>
        <TouchableOpacity style={styles.resetButton} onPress={resetProgress}>
          <Text style={styles.resetButtonText}>🗑️ RESET PROGRESSI</Text>
        </TouchableOpacity>
        <Text style={styles.dangerText}>
          Riporta monete, vittorie e statistiche a zero
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Le tue statistiche</Text>
        <Text style={styles.statsText}>Partite giocate: {playerData.gamesPlayed}</Text>
        <Text style={styles.statsText}>Vittorie: {playerData.gamesWon}</Text>
        <Text style={styles.statsText}>Monete: {playerData.coins}</Text>
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
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    color: COLORS.denari,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 12,
    padding: 16,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  settingRow: {
    marginBottom: 20,
  },
  settingLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 10,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.glass,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  optionButtonWide: {
    flex: 1,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: COLORS.denari,
    borderColor: COLORS.denari,
  },
  optionButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  optionButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  saveButton: {
    marginHorizontal: 20,
    backgroundColor: COLORS.denari,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    width: '100%',
    alignItems: 'center',
  },
  resetButtonText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dangerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  statsSection: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    padding: 16,
    backgroundColor: COLORS.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statsTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 10,
  },
  statsText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
});

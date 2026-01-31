import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_PLAYER_DATA, LEAGUES } from './constants';

const STORAGE_KEY = '@bisca_player_data';

export async function loadPlayerData() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data !== null) {
      return JSON.parse(data);
    }
    return { ...INITIAL_PLAYER_DATA };
  } catch (error) {
    console.error('Error loading player data:', error);
    return { ...INITIAL_PLAYER_DATA };
  }
}

export async function savePlayerData(data) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving player data:', error);
  }
}

export async function updatePlayerAfterGame(won, league) {
  const data = await loadPlayerData();
  const leagueInfo = LEAGUES.find((l) => l.id === league);
  
  data.gamesPlayed += 1;
  
  if (won) {
    data.gamesWon += 1;
    data.coins += leagueInfo.reward;
    
    // Update highest league if necessary
    const currentLeagueIdx = LEAGUES.findIndex((l) => l.id === data.highestLeague);
    const wonLeagueIdx = LEAGUES.findIndex((l) => l.id === league);
    if (wonLeagueIdx > currentLeagueIdx) {
      data.highestLeague = league;
    }
  }
  
  await savePlayerData(data);
  return data;
}

export async function deductEntryFee(league) {
  const data = await loadPlayerData();
  const leagueInfo = LEAGUES.find((l) => l.id === league);
  
  if (data.coins >= leagueInfo.entryFee) {
    data.coins -= leagueInfo.entryFee;
    await savePlayerData(data);
    return { success: true, newCoins: data.coins };
  }
  
  return { success: false, newCoins: data.coins };
}

export async function updatePlayerName(name) {
  const data = await loadPlayerData();
  data.name = name;
  await savePlayerData(data);
  return data;
}

export function getPlayerLeague(coins) {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (coins >= LEAGUES[i].minCoins) {
      return LEAGUES[i];
    }
  }
  return LEAGUES[0];
}

export function getAvailableLeagues(coins) {
  return LEAGUES.filter((league) => coins >= league.entryFee);
}

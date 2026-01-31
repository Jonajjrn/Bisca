import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadPlayerData, savePlayerData } from '../utils/storage';
import { INITIAL_PLAYER_DATA } from '../utils/constants';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [playerData, setPlayerData] = useState(INITIAL_PLAYER_DATA);
  const [loading, setLoading] = useState(true);
  const [currentLeague, setCurrentLeague] = useState(null);
  const [gameSettings, setGameSettings] = useState({
    botCount: 3,
    lives: 3,
    maxCards: 5,
  });

  useEffect(() => {
    loadPlayerData().then((data) => {
      setPlayerData(data);
      setLoading(false);
    });
  }, []);

  const updatePlayerData = async (newData) => {
    const updated = { ...playerData, ...newData };
    setPlayerData(updated);
    await savePlayerData(updated);
  };

  const addCoins = async (amount) => {
    const newCoins = playerData.coins + amount;
    await updatePlayerData({ coins: newCoins });
  };

  const deductCoins = async (amount) => {
    if (playerData.coins >= amount) {
      const newCoins = playerData.coins - amount;
      await updatePlayerData({ coins: newCoins });
      return true;
    }
    return false;
  };

  const recordGameResult = async (won, league) => {
    const updates = {
      gamesPlayed: playerData.gamesPlayed + 1,
    };
    
    if (won) {
      updates.gamesWon = playerData.gamesWon + 1;
    }
    
    await updatePlayerData(updates);
  };

  const value = {
    playerData,
    loading,
    currentLeague,
    gameSettings,
    setCurrentLeague,
    setGameSettings,
    updatePlayerData,
    addCoins,
    deductCoins,
    recordGameResult,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

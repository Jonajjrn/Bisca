import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { CardComponent, CardBack } from '../components/Card';
import { PlayerBox } from '../components/PlayerBox';
import { LEAGUES } from '../utils/constants';
import {
  Player,
  createDeck,
  calculateBotMove,
  calculateBotBid,
  getRandomBotNames,
  getBotDialogue,
} from '../utils/gameLogic';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GameScreen({ navigation, route }) {
  const { league: leagueId } = route.params;
  const { playerData, addCoins, recordGameResult, gameSettings } = useGame();
  const league = LEAGUES.find((l) => l.id === leagueId) || LEAGUES[0];

  // Game State
  const [players, setPlayers] = useState([]);
  const [tableCards, setTableCards] = useState([]);
  const [cardsToDeal, setCardsToDeal] = useState(gameSettings.maxCards);
  const [delta, setDelta] = useState(-1);
  const [roundStarterIndex, setRoundStarterIndex] = useState(0);
  const [currentBidsSum, setCurrentBidsSum] = useState(0);
  const [gamePhase, setGamePhase] = useState('init'); // init, bidding, playing, roundEnd, gameOver
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [activePlayer, setActivePlayer] = useState(null);
  const [message, setMessage] = useState('');
  const [showJollyModal, setShowJollyModal] = useState(false);
  const [jollyCardIndex, setJollyCardIndex] = useState(-1);
  const [winner, setWinner] = useState(null);
  const [forbiddenBid, setForbiddenBid] = useState(-1);
  const [speechBubble, setSpeechBubble] = useState({ player: null, text: '' });

  // Initialize game
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const botNames = getRandomBotNames(gameSettings.botCount);
    const newPlayers = [
      new Player(playerData.name, true, gameSettings.lives),
      ...botNames.map((name) => new Player(name, false, gameSettings.lives)),
    ];
    setPlayers(newPlayers);
    setCardsToDeal(gameSettings.maxCards);
    setDelta(-1);
    setRoundStarterIndex(0);
    setTableCards([]);
    setMessage('Preparazione partita...');
    
    setTimeout(() => {
      startRound(newPlayers, gameSettings.maxCards, 0);
    }, 1500);
  };

  const startRound = (currentPlayers, cards, starterIdx) => {
    const active = currentPlayers.filter((p) => !p.eliminated);
    
    if (active.length <= 1) {
      const winnerPlayer = active.length === 1 ? active[0] : null;
      endGame(winnerPlayer);
      return;
    }

    // Calculate max cards based on active players
    const physicalLimit = Math.floor(40 / active.length);
    const actualCards = Math.min(cards, physicalLimit, gameSettings.maxCards);
    setCardsToDeal(actualCards);

    const roundLabel = actualCards === 1 ? 'INDIANA (1 CARTA)' : `ROUND ${actualCards} CARTE`;
    setMessage(roundLabel);

    // Deal cards
    const deck = createDeck();
    active.forEach((p) => {
      p.hand = [];
      p.taken = 0;
      p.bid = -1;
      for (let i = 0; i < actualCards; i++) {
        const card = deck.pop();
        card.resetScore();
        p.hand.push(card);
      }
      if (actualCards > 1) {
        p.hand.sort((a, b) => a.baseScore - b.baseScore);
      }
    });

    setPlayers([...currentPlayers]);
    setCurrentBidsSum(0);
    setTableCards([]);
    setGamePhase('bidding');

    // Start bidding
    const starterIndex = starterIdx % active.length;
    setTimeout(() => {
      doBidding(0, active, starterIndex, currentPlayers, actualCards);
    }, 2000);
  };

  const doBidding = (idx, activeList, starterIdx, allPlayers, cards) => {
    if (idx >= activeList.length) {
      // Bidding complete, start playing
      setMessage('Fase di gioco');
      setForbiddenBid(-1);
      setTableCards([]);
      setGamePhase('playing');
      
      setTimeout(() => {
        playTurn(0, activeList, allPlayers, cards);
      }, 1000);
      return;
    }

    const orderIdx = (starterIdx + idx) % activeList.length;
    const p = activeList[orderIdx];
    setActivePlayer(p);
    setCurrentPlayerIndex(idx);

    const isLastBidder = idx === activeList.length - 1;
    let forbidden = -1;
    if (isLastBidder) {
      forbidden = cards - currentBidsSum;
      if (forbidden < 0) forbidden = -1;
    }
    setForbiddenBid(forbidden);

    if (p.isHuman) {
      setMessage(isLastBidder && forbidden >= 0 
        ? `Scommetti (non puoi dire ${forbidden})`
        : 'Fai la tua scommessa');
    } else {
      // Bot bidding
      setTimeout(() => {
        let bid = calculateBotBid(p, cards, activeList, cards === 1);
        
        if (isLastBidder && bid === forbidden) {
          bid = bid === 0 ? 1 : bid - 1;
        }

        p.bid = bid;
        setCurrentBidsSum((prev) => prev + bid);
        
        // Show bot dialogue
        if (bid === 0) triggerSpeech(p, 'LOW_BID');
        if (bid >= 2) triggerSpeech(p, 'HIGH_BID');
        
        setMessage(`${p.name} scommette ${bid}`);
        setPlayers([...allPlayers]);

        setTimeout(() => {
          doBidding(idx + 1, activeList, starterIdx, allPlayers, cards);
        }, 800);
      }, 1000);
    }
  };

  const handlePlayerBid = (bid) => {
    const active = players.filter((p) => !p.eliminated);
    const human = active.find((p) => p.isHuman);
    if (!human) return;

    human.bid = bid;
    setCurrentBidsSum((prev) => prev + bid);
    setPlayers([...players]);

    const starterIdx = roundStarterIndex % active.length;
    const humanIdx = active.indexOf(human);
    const bidIdx = (humanIdx - starterIdx + active.length) % active.length;

    setTimeout(() => {
      doBidding(bidIdx + 1, active, starterIdx, players, cardsToDeal);
    }, 500);
  };

  const playTurn = (idx, activeList, allPlayers, cards) => {
    if (tableCards.length === activeList.length) {
      // Resolve trick
      setTimeout(() => {
        resolveTrick(activeList, allPlayers, cards);
      }, 1000);
      return;
    }

    const p = activeList[idx % activeList.length];
    setActivePlayer(p);
    setCurrentPlayerIndex(idx);

    if (p.isHuman) {
      setMessage('Tocca a te - Scegli una carta');
    } else {
      // Bot plays
      setTimeout(() => {
        const chosenIdx = calculateBotMove(p, tableCards);
        const card = p.hand[chosenIdx];
        
        if (card.isJolly()) {
          card.setJollyMode(p.taken < p.bid);
        } else {
          card.resetScore();
        }

        p.hand.splice(chosenIdx, 1);
        setTableCards((prev) => [...prev, { player: p, card }]);
        setPlayers([...allPlayers]);

        setTimeout(() => {
          playTurn(idx + 1, activeList, allPlayers, cards);
        }, 600);
      }, 800);
    }
  };

  const handleCardPlay = (cardIdx) => {
    const human = players.find((p) => p.isHuman && !p.eliminated);
    if (!human || gamePhase !== 'playing') return;

    const card = human.hand[cardIdx];

    if (card.isJolly()) {
      setJollyCardIndex(cardIdx);
      setShowJollyModal(true);
    } else {
      card.resetScore();
      finalizeCardPlay(human, cardIdx, card);
    }
  };

  const handleJollyChoice = (isMax) => {
    const human = players.find((p) => p.isHuman && !p.eliminated);
    if (!human) return;

    const card = human.hand[jollyCardIndex];
    card.setJollyMode(isMax);
    setShowJollyModal(false);
    finalizeCardPlay(human, jollyCardIndex, card);
  };

  const finalizeCardPlay = (player, cardIdx, card) => {
    player.hand.splice(cardIdx, 1);
    setTableCards((prev) => [...prev, { player, card }]);
    setPlayers([...players]);

    const active = players.filter((p) => !p.eliminated);
    const playerIdx = active.indexOf(player);

    setTimeout(() => {
      playTurn(playerIdx + 1, active, players, cardsToDeal);
    }, 600);
  };

  const resolveTrick = (activeList, allPlayers, cards) => {
    let winnerEntry = tableCards[0];
    for (let i = 1; i < tableCards.length; i++) {
      if (tableCards[i].card.effectiveScore > winnerEntry.card.effectiveScore) {
        winnerEntry = tableCards[i];
      }
    }

    winnerEntry.player.taken++;
    triggerSpeech(winnerEntry.player, 'WIN_TRICK');
    
    setMessage(`Mano a ${winnerEntry.player.name}!`);
    setPlayers([...allPlayers]);

    setTimeout(() => {
      setTableCards([]);

      if (activeList[0].hand.length > 0) {
        const startIdx = activeList.indexOf(winnerEntry.player);
        playTurn(startIdx, activeList, allPlayers, cards);
      } else {
        endRound(activeList, allPlayers);
      }
    }, 2000);
  };

  const endRound = (activeList, allPlayers) => {
    let deaths = [];

    activeList.forEach((p) => {
      const diff = Math.abs(p.taken - p.bid);
      if (diff > 0) {
        p.lives -= diff;
        triggerSpeech(p, 'LOSE_LIFE');
        
        if (p.lives <= 0 && !p.eliminated) {
          p.eliminated = true;
          deaths.push(p.name);
          triggerSpeech(p, 'ELIMINATED');
        }
      }
    });

    setPlayers([...allPlayers]);

    if (deaths.length > 0) {
      setMessage(`💀 Eliminati: ${deaths.join(', ')}`);
    } else {
      setMessage('Fine round');
    }

    setGamePhase('roundEnd');
    setRoundStarterIndex((prev) => prev + 1);

    // Calculate next cards
    let nextCards = cardsToDeal;
    if (delta === -1) {
      nextCards--;
      if (nextCards < 1) {
        nextCards = 2;
        setDelta(1);
      }
    } else {
      nextCards++;
      if (nextCards > gameSettings.maxCards) {
        nextCards = gameSettings.maxCards - 1;
        setDelta(-1);
      }
    }

    setTimeout(() => {
      const stillActive = allPlayers.filter((p) => !p.eliminated);
      if (stillActive.length <= 1) {
        endGame(stillActive[0] || null);
      } else {
        setCardsToDeal(nextCards);
        startRound(allPlayers, nextCards, roundStarterIndex + 1);
      }
    }, 3000);
  };

  const endGame = async (winnerPlayer) => {
    setGamePhase('gameOver');
    setWinner(winnerPlayer);

    const humanWon = winnerPlayer && winnerPlayer.isHuman;
    await recordGameResult(humanWon, leagueId);

    if (humanWon) {
      await addCoins(league.reward);
      setMessage(`🏆 VITTORIA! +${league.reward} monete!`);
    } else {
      setMessage(`💀 SCONFITTA - ${winnerPlayer?.name || 'Nessuno'} ha vinto`);
    }
  };

  const triggerSpeech = (player, eventType) => {
    if (player.isHuman) return;
    
    const prob = player.name === 'Mao' ? 0.95 : eventType === 'ELIMINATED' ? 1.0 : 0.4;
    if (Math.random() > prob) return;

    const text = getBotDialogue(player.name, eventType);
    setSpeechBubble({ player: player.name, text });
    
    setTimeout(() => {
      setSpeechBubble({ player: null, text: '' });
    }, 2500);
  };

  const human = players.find((p) => p.isHuman);
  const bots = players.filter((p) => !p.isHuman);
  const isIndiana = cardsToDeal === 1;
  const activePlayers = players.filter((p) => !p.eliminated);
  const dealerPlayer = activePlayers[(roundStarterIndex - 1 + activePlayers.length) % activePlayers.length];

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f0f23']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert('Abbandona partita?', 'Perderai la quota di ingresso.', [
            { text: 'Continua', style: 'cancel' },
            { text: 'Abbandona', style: 'destructive', onPress: () => navigation.goBack() },
          ]);
        }}>
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
        
        <View style={[styles.leagueBadge, { backgroundColor: league.color }]}>
          <Text style={styles.leagueText}>{league.name}</Text>
        </View>
        
        <Text style={styles.roundText}>
          {cardsToDeal === 1 ? 'INDIANA' : `${cardsToDeal} CARTE`}
        </Text>
      </View>

      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {/* Bot Players */}
      <ScrollView 
        horizontal 
        style={styles.botsContainer}
        contentContainerStyle={styles.botsContent}
        showsHorizontalScrollIndicator={false}
      >
        {bots.map((bot) => (
          <View key={bot.name} style={styles.botWrapper}>
            <PlayerBox
              player={bot}
              isActive={activePlayer === bot}
              isDealer={dealerPlayer === bot}
              showCards={isIndiana}
              cardsToDeal={cardsToDeal}
            />
            {speechBubble.player === bot.name && (
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>{speechBubble.text}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Table Cards */}
      <View style={styles.tableContainer}>
        <View style={styles.tableCards}>
          {tableCards.map((tc, i) => (
            <View key={i} style={styles.tableCardWrapper}>
              <Text style={styles.tableCardLabel}>{tc.player.name}</Text>
              <CardComponent card={tc.card} style={styles.tableCard} />
            </View>
          ))}
        </View>
      </View>

      {/* Player Area */}
      <View style={styles.playerArea}>
        {/* Player Stats */}
        {human && (
          <View style={styles.playerStats}>
            <Text style={styles.playerName}>{human.name}</Text>
            <View style={styles.heartsRow}>
              {Array.from({ length: gameSettings.lives }).map((_, i) => (
                <Text key={i} style={[styles.heart, i >= human.lives && styles.deadHeart]}>
                  ❤️
                </Text>
              ))}
            </View>
            <View style={styles.bidInfo}>
              <Text style={styles.bidText}>BID: {human.bid >= 0 ? human.bid : '?'}</Text>
              <Text style={[
                styles.takenText,
                human.bid >= 0 && human.taken === human.bid && styles.takenOk,
                human.bid >= 0 && human.taken > human.bid && styles.takenDanger,
              ]}>
                PRESE: {human.taken}
              </Text>
            </View>
          </View>
        )}

        {/* Bid Buttons */}
        {gamePhase === 'bidding' && activePlayer?.isHuman && (
          <View style={styles.bidButtons}>
            {Array.from({ length: cardsToDeal + 1 }).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.bidButton,
                  i === forbiddenBid && styles.bidButtonDisabled,
                ]}
                onPress={() => handlePlayerBid(i)}
                disabled={i === forbiddenBid}
              >
                <Text style={styles.bidButtonText}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Player Hand */}
        {human && !human.eliminated && (
          <ScrollView 
            horizontal 
            style={styles.handContainer}
            contentContainerStyle={styles.handContent}
            showsHorizontalScrollIndicator={false}
          >
            {human.hand.map((card, i) => (
              <View key={i} style={styles.cardWrapper}>
                <CardComponent
                  card={card}
                  isHidden={isIndiana}
                  isJolly={card.isJolly()}
                  onPress={gamePhase === 'playing' && activePlayer?.isHuman ? () => handleCardPlay(i) : null}
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Next Round / End Game Buttons */}
        {gamePhase === 'gameOver' && (
          <View style={styles.endButtons}>
            <TouchableOpacity
              style={styles.endButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.endButtonText}>
                {winner?.isHuman ? '🏆 RACCOGLI PREMIO' : 'TORNA AL MENU'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Jolly Modal */}
      <Modal visible={showJollyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🟡 ASSO JOLLY</Text>
            <Text style={styles.modalSubtitle}>Definisci il valore della carta</Text>
            
            <TouchableOpacity
              style={[styles.jollyButton, styles.jollyMax]}
              onPress={() => handleJollyChoice(true)}
            >
              <Text style={styles.jollyButtonText}>MAX (Vinci Tutto)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.jollyButton, styles.jollyMin]}
              onPress={() => handleJollyChoice(false)}
            >
              <Text style={styles.jollyButtonText}>MIN (Perdi Apposta)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  exitText: {
    color: '#888',
    fontSize: 24,
  },
  leagueBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  leagueText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  roundText: {
    color: '#888',
    fontSize: 14,
  },
  messageContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  messageText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botsContainer: {
    maxHeight: 180,
  },
  botsContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  botWrapper: {
    marginHorizontal: 8,
    position: 'relative',
  },
  speechBubble: {
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    maxWidth: 150,
  },
  speechText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  tableCardWrapper: {
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  tableCardLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tableCard: {
    width: 60,
    height: 90,
  },
  playerArea: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 15,
    paddingBottom: 30,
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 15,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heartsRow: {
    flexDirection: 'row',
  },
  heart: {
    fontSize: 16,
  },
  deadHeart: {
    opacity: 0.2,
  },
  bidInfo: {
    flexDirection: 'row',
    gap: 15,
  },
  bidText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  takenText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  takenOk: {
    color: '#0f0',
  },
  takenDanger: {
    color: '#f00',
  },
  bidButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  bidButton: {
    width: 50,
    height: 50,
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ca1af',
  },
  bidButtonDisabled: {
    opacity: 0.3,
    borderColor: '#f00',
  },
  bidButtonText: {
    color: '#4ca1af',
    fontSize: 20,
    fontWeight: 'bold',
  },
  handContainer: {
    maxHeight: 130,
  },
  handContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cardWrapper: {
    marginHorizontal: 5,
  },
  endButtons: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  endButton: {
    backgroundColor: '#8b0000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#111',
    padding: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  jollyButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
  },
  jollyMax: {
    backgroundColor: '#e67e22',
  },
  jollyMin: {
    backgroundColor: '#3498db',
  },
  jollyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

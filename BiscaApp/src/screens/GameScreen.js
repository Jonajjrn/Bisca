import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  Animated,
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

// Card fan layout constants
const CARD_FAN_ROTATION_DEGREES = 8;
const CARD_FAN_LIFT_OFFSET = 5;
const CARD_OVERLAP_OFFSET = -25;

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
  const [gamePhase, setGamePhase] = useState('init'); // init, dealerSelect, bidding, playing, roundEnd, gameOver
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [activePlayer, setActivePlayer] = useState(null);
  const [message, setMessage] = useState('');
  const [showJollyModal, setShowJollyModal] = useState(false);
  const [jollyCardIndex, setJollyCardIndex] = useState(-1);
  const [winner, setWinner] = useState(null);
  const [forbiddenBid, setForbiddenBid] = useState(-1);
  const [speechBubble, setSpeechBubble] = useState({ player: null, text: '' });
  const [isHumanTurn, setIsHumanTurn] = useState(false);
  const [showDealerAnimation, setShowDealerAnimation] = useState(false);
  const [dealerAnimationPlayer, setDealerAnimationPlayer] = useState(null);
  const [turnPlayersPlayed, setTurnPlayersPlayed] = useState(0);
  
  // Animation refs
  const dealerAnimValue = useRef(new Animated.Value(0)).current;
  const cardPlayedRef = useRef(false); // Prevent double card plays

  // Initialize game
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const botOpponents = getRandomBotNames(gameSettings.botCount);
    const newPlayers = [
      new Player(playerData.name, true, gameSettings.lives, playerData.avatar || '🎴', null),
      ...botOpponents.map((opp) => new Player(opp.name, false, gameSettings.lives, opp.emoji, opp.personality)),
    ];
    setPlayers(newPlayers);
    setCardsToDeal(gameSettings.maxCards);
    setDelta(-1);
    setTableCards([]);
    setMessage('Selezione mazziere...');
    setGamePhase('dealerSelect');
    
    // Random dealer selection animation
    setTimeout(() => {
      selectRandomDealer(newPlayers);
    }, 500);
  };

  const selectRandomDealer = (playerList) => {
    const randomIndex = Math.floor(Math.random() * playerList.length);
    let animationCount = 0;
    const totalAnimations = playerList.length * 2 + randomIndex; // Spin around twice then land on random
    
    setShowDealerAnimation(true);
    
    const animateDealer = () => {
      const currentIdx = animationCount % playerList.length;
      setDealerAnimationPlayer(playerList[currentIdx]);
      
      // Animate pulse
      Animated.sequence([
        Animated.timing(dealerAnimValue, {
          toValue: 1,
          duration: 100 + (animationCount * 10), // Slow down over time
          useNativeDriver: true,
        }),
        Animated.timing(dealerAnimValue, {
          toValue: 0,
          duration: 100 + (animationCount * 10),
          useNativeDriver: true,
        }),
      ]).start();
      
      animationCount++;
      
      if (animationCount < totalAnimations) {
        setTimeout(animateDealer, 150 + (animationCount * 20)); // Slow down
      } else {
        // Final dealer selected
        setRoundStarterIndex(randomIndex);
        setShowDealerAnimation(false);
        setDealerAnimationPlayer(null);
        setMessage(`${playerList[randomIndex].name} è il mazziere!`);
        
        setTimeout(() => {
          startRound(playerList, gameSettings.maxCards, randomIndex);
        }, 1500);
      }
    };
    
    animateDealer();
  };

  const startRound = (currentPlayers, cards, starterIdx) => {
    const active = currentPlayers.filter((p) => !p.eliminated);
    
    if (active.length <= 1) {
      const winnerPlayer = active.length === 1 ? active[0] : null;
      endGame(winnerPlayer);
      return;
    }

    // Check for SUDDEN DEATH mode: 1v1 and at least one player has only 1 life
    const isSuddenDeath = active.length === 2 && active.some((p) => p.lives === 1);

    // Calculate max cards based on active players
    const physicalLimit = Math.floor(40 / active.length);
    let actualCards = Math.min(cards, physicalLimit, gameSettings.maxCards);
    
    // In sudden death mode, force 1 card (Indiana mode)
    if (isSuddenDeath) {
      actualCards = 1;
    }
    
    setCardsToDeal(actualCards);

    let roundLabel = actualCards === 1 ? 'INDIANA (1 CARTA)' : `ROUND ${actualCards} CARTE`;
    if (isSuddenDeath) {
      roundLabel = '⚔️ SUDDEN DEATH ⚔️';
    }
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
    setTurnPlayersPlayed(0);
    setGamePhase('bidding');
    setIsHumanTurn(false);
    cardPlayedRef.current = false;

    // Start bidding
    const starterIndex = starterIdx % active.length;
    setTimeout(() => {
      doBidding(0, active, starterIndex, currentPlayers, actualCards, 0);
    }, isSuddenDeath ? 3000 : 2000);
  };

  const doBidding = (idx, activeList, starterIdx, allPlayers, cards, runningBidsSum) => {
    if (idx >= activeList.length) {
      // Bidding complete, start playing
      setMessage('Fase di gioco');
      setForbiddenBid(-1);
      setTableCards([]);
      setTurnPlayersPlayed(0);
      setGamePhase('playing');
      cardPlayedRef.current = false;
      
      // The dealer (starterIdx) leads the first trick
      setRoundStarterIndex(starterIdx);
      
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
      // Calculate what bid would make total bids equal to cards (which is forbidden)
      forbidden = cards - runningBidsSum;
      // Only forbid if it's a valid bid option (0 to cards)
      if (forbidden < 0 || forbidden > cards) forbidden = -1;
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
        const newBidsSum = runningBidsSum + bid;
        setCurrentBidsSum(newBidsSum);
        
        // Show bot dialogue
        if (bid === 0) triggerSpeech(p, 'LOW_BID');
        if (bid >= 2) triggerSpeech(p, 'HIGH_BID');
        
        setMessage(`${p.name} scommette ${bid}`);
        setPlayers([...allPlayers]);

        setTimeout(() => {
          doBidding(idx + 1, activeList, starterIdx, allPlayers, cards, newBidsSum);
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

  const playTurn = (playersAlreadyPlayed, activeList, allPlayers, cards) => {
    // Check if all players have played this trick
    if (playersAlreadyPlayed >= activeList.length) {
      // All players have played, resolve trick
      setIsHumanTurn(false);
      cardPlayedRef.current = false;
      setTimeout(() => {
        resolveTrick(activeList, allPlayers, cards);
      }, 1000);
      return;
    }

    // Get current player based on round starter and how many have played
    const currentIdx = (roundStarterIndex + playersAlreadyPlayed) % activeList.length;
    const p = activeList[currentIdx];
    setActivePlayer(p);
    setCurrentPlayerIndex(playersAlreadyPlayed);
    setTurnPlayersPlayed(playersAlreadyPlayed);

    if (p.isHuman) {
      setIsHumanTurn(true);
      cardPlayedRef.current = false;
      setMessage('Tocca a te - Scegli una carta');
    } else {
      setIsHumanTurn(false);
      // Bot plays
      setTimeout(() => {
        const chosenIdx = calculateBotMove(p, tableCards);
        if (chosenIdx < 0 || chosenIdx >= p.hand.length) {
          console.error('Invalid bot move index:', chosenIdx);
          return;
        }
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
          playTurn(playersAlreadyPlayed + 1, activeList, allPlayers, cards);
        }, 600);
      }, 800);
    }
  };

  const handleCardPlay = (cardIdx) => {
    // Prevent multiple card plays
    if (cardPlayedRef.current) {
      return;
    }
    
    const human = players.find((p) => p.isHuman && !p.eliminated);
    if (!human || gamePhase !== 'playing' || !isHumanTurn) return;
    
    // Mark card as being played
    cardPlayedRef.current = true;

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
    setIsHumanTurn(false);

    const active = players.filter((p) => !p.eliminated);
    const nextPlayersPlayed = turnPlayersPlayed + 1;

    setTimeout(() => {
      playTurn(nextPlayersPlayed, active, players, cardsToDeal);
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

    // Update round starter to the trick winner for next trick
    const winnerIdx = activeList.indexOf(winnerEntry.player);
    setRoundStarterIndex(winnerIdx);

    setTimeout(() => {
      setTableCards([]);
      setTurnPlayersPlayed(0);
      cardPlayedRef.current = false;

      if (activeList[0].hand.length > 0) {
        // Start new trick from the winner
        playTurn(0, activeList, allPlayers, cards);
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
    if (!player.personality) return;
    
    const prob = eventType === 'ELIMINATED' ? 1.0 : 0.4;
    if (Math.random() > prob) return;

    const text = getBotDialogue(player.name, eventType, player.personality);
    setSpeechBubble({ player: player.name, text });
    
    setTimeout(() => {
      setSpeechBubble({ player: null, text: '' });
    }, 2500);
  };

  const human = players.find((p) => p.isHuman);
  const bots = players.filter((p) => !p.isHuman);
  const isIndiana = cardsToDeal === 1;
  const activePlayers = players.filter((p) => !p.eliminated);
  const dealerPlayer = activePlayers.length > 0 
    ? activePlayers[roundStarterIndex % activePlayers.length] 
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={() => {
            Alert.alert('Abbandona partita?', 'Perderai la quota di ingresso.', [
              { text: 'Continua', style: 'cancel' },
              { text: 'Abbandona', style: 'destructive', onPress: () => navigation.goBack() },
            ]);
          }}
        >
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
        
        <View style={[styles.leagueBadge, { backgroundColor: league.color }]}>
          <Text style={styles.leagueText}>{league.name}</Text>
        </View>
        
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>
            {cardsToDeal === 1 ? '🎯 INDIANA' : `${cardsToDeal} CARTE`}
          </Text>
        </View>
      </View>

      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {/* Bot Players - Positioned around the table */}
      <View style={styles.botsContainer}>
        {bots.map((bot, index) => {
          // Position bots around the top/sides based on count
          const totalBots = bots.length;
          let positionStyle = {};
          
          if (totalBots === 1) {
            positionStyle = { alignSelf: 'center' };
          } else if (totalBots === 2) {
            positionStyle = index === 0 
              ? { alignSelf: 'flex-start', marginLeft: 20 } 
              : { alignSelf: 'flex-end', marginRight: 20 };
          } else {
            // Spread across for 3+ bots
            const isLeft = index < totalBots / 2;
            const isCenter = totalBots % 2 === 1 && index === Math.floor(totalBots / 2);
            if (isCenter) {
              positionStyle = { alignSelf: 'center' };
            } else if (isLeft) {
              positionStyle = { alignSelf: 'flex-start', marginLeft: 10 + (index * 5) };
            } else {
              positionStyle = { alignSelf: 'flex-end', marginRight: 10 + ((totalBots - 1 - index) * 5) };
            }
          }
          
          return (
            <View 
              key={bot.name} 
              style={[
                styles.botWrapper,
                positionStyle,
                { transform: [{ scale: 0.9 }] }
              ]}
            >
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
          );
        })}
      </View>

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

        {/* Player Hand - Fan Layout */}
        {human && !human.eliminated && (
          <View style={styles.handContainer}>
            <View style={styles.fanContainer}>
              {human.hand.map((card, i) => {
                const totalCards = human.hand.length;
                const middleIndex = (totalCards - 1) / 2;
                const rotationAngle = (i - middleIndex) * CARD_FAN_ROTATION_DEGREES;
                const translateY = Math.abs(i - middleIndex) * CARD_FAN_LIFT_OFFSET;
                
                return (
                  <View 
                    key={i} 
                    style={[
                      styles.fanCardWrapper,
                      { 
                        transform: [
                          { rotate: `${rotationAngle}deg` },
                          { translateY: translateY },
                        ],
                        marginLeft: i === 0 ? 0 : CARD_OVERLAP_OFFSET,
                        zIndex: i,
                      }
                    ]}
                  >
                    <CardComponent
                      card={card}
                      isHidden={isIndiana}
                      isJolly={card.isJolly()}
                      onPress={gamePhase === 'playing' && isHumanTurn && !cardPlayedRef.current ? () => handleCardPlay(i) : null}
                    />
                  </View>
                );
              })}
            </View>
          </View>
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

      {/* Dealer Selection Animation Modal */}
      <Modal visible={showDealerAnimation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dealerModalContent}>
            <Text style={styles.dealerModalTitle}>🎲 ESTRAZIONE MAZZIERE</Text>
            {dealerAnimationPlayer && (
              <Animated.View style={[
                styles.dealerAnimCard,
                {
                  transform: [
                    { scale: dealerAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    })},
                  ],
                },
              ]}>
                <Text style={styles.dealerAnimEmoji}>{dealerAnimationPlayer.emoji || '🎴'}</Text>
                <Text style={styles.dealerAnimName}>{dealerAnimationPlayer.name}</Text>
              </Animated.View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitText: {
    color: '#888',
    fontSize: 20,
  },
  leagueBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leagueText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  roundBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roundText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messageContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    marginBottom: 10,
  },
  messageText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxHeight: 200,
  },
  botWrapper: {
    marginHorizontal: 4,
    marginVertical: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingBottom: 20,
  },
  fanContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  fanCardWrapper: {
    // Transform is applied dynamically in component
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
  dealerModalContent: {
    backgroundColor: '#111',
    padding: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4ca1af',
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  dealerModalTitle: {
    color: '#4ca1af',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  dealerAnimCard: {
    backgroundColor: '#1a1a2e',
    padding: 25,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  dealerAnimEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  dealerAnimName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

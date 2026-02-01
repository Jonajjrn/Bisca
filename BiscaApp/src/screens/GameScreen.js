import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { CardComponent, CardBack } from '../components/Card';
import { LEAGUES, COLORS } from '../utils/constants';
import { getCardImage } from '../utils/images';
import {
  Player,
  createDeck,
  calculateBotMove,
  calculateBotBid,
  getRandomBotNames,
  getBotDialogue,
} from '../utils/gameLogic';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card fan layout constants
const CARD_FAN_ROTATION_DEGREES = 6;
const CARD_FAN_LIFT_OFFSET = 4;
const CARD_OVERLAP_OFFSET = -20;

export default function GameScreen({ navigation, route }) {
  const { league: leagueId } = route.params;
  const { playerData, addCoins, recordGameResult, gameSettings } = useGame();
  const league = LEAGUES.find((l) => l.id === leagueId) || LEAGUES[0];

  // Game State
  const [players, setPlayers] = useState([]);
  const [tableCards, setTableCards] = useState([]);
  const [cardsToDeal, setCardsToDeal] = useState(gameSettings.maxCards);
  const [delta, setDelta] = useState(-1);
  const [dealerIndex, setDealerIndex] = useState(0);
  const [trickStarterIndex, setTrickStarterIndex] = useState(0);
  const [currentBidsSum, setCurrentBidsSum] = useState(0);
  const [gamePhase, setGamePhase] = useState('init');
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
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  
  // Animation refs
  const dealerAnimValue = useRef(new Animated.Value(0)).current;
  const cardPlayedRef = useRef(false);

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
    setMessage('Estrazione mazziere...');
    setGamePhase('dealerSelect');
    
    setTimeout(() => {
      selectRandomDealer(newPlayers);
    }, 500);
  };

  const selectRandomDealer = (playerList) => {
    const randomIndex = Math.floor(Math.random() * playerList.length);
    let animationCount = 0;
    const totalAnimations = playerList.length * 2 + randomIndex;
    
    setShowDealerAnimation(true);
    
    const animateDealer = () => {
      const currentIdx = animationCount % playerList.length;
      setDealerAnimationPlayer(playerList[currentIdx]);
      
      Animated.sequence([
        Animated.timing(dealerAnimValue, {
          toValue: 1,
          duration: 100 + (animationCount * 10),
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
        setTimeout(animateDealer, 150 + (animationCount * 20));
      } else {
        // Final dealer selected - show the correct final player
        const finalDealer = playerList[randomIndex];
        setDealerAnimationPlayer(finalDealer);
        setDealerIndex(randomIndex);
        setTrickStarterIndex(randomIndex);
        
        setTimeout(() => {
          setShowDealerAnimation(false);
          setMessage(`${finalDealer.name} è il mazziere!`);
          
          setTimeout(() => {
            startRound(playerList, gameSettings.maxCards, randomIndex);
          }, 1500);
        }, 1000);
      }
    };
    
    animateDealer();
  };

  const startRound = (currentPlayers, cards, dealerIdx) => {
    const active = currentPlayers.filter((p) => !p.eliminated);
    
    if (active.length <= 1) {
      const winnerPlayer = active.length === 1 ? active[0] : null;
      endGame(winnerPlayer);
      return;
    }

    // Check for SUDDEN DEATH mode
    const suddenDeath = active.length === 2 && active.some((p) => p.lives === 1);
    setIsSuddenDeath(suddenDeath);

    const physicalLimit = Math.floor(40 / active.length);
    let actualCards = Math.min(cards, physicalLimit, gameSettings.maxCards);
    
    if (suddenDeath) {
      actualCards = 1;
    }
    
    setCardsToDeal(actualCards);

    let roundLabel = actualCards === 1 ? '🎯 INDIANA (1 CARTA)' : `ROUND ${actualCards} CARTE`;
    if (suddenDeath) {
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

    // Bidding starts from dealer - use name matching for robustness
    const dealerPlayer = currentPlayers[dealerIdx % currentPlayers.length];
    const starterIdx = active.findIndex(p => p.name === dealerPlayer.name);
    const starterIndex = starterIdx >= 0 ? starterIdx : 0;
    
    setTimeout(() => {
      doBidding(0, active, starterIndex, currentPlayers, actualCards, 0);
    }, suddenDeath ? 3000 : 2000);
  };

  const doBidding = (idx, activeList, starterIdx, allPlayers, cards, runningBidsSum) => {
    if (idx >= activeList.length) {
      setMessage('Fase di gioco');
      setForbiddenBid(-1);
      setTableCards([]);
      setTurnPlayersPlayed(0);
      setGamePhase('playing');
      cardPlayedRef.current = false;
      
      // First player after dealer leads the first trick
      setTrickStarterIndex(0);
      
      setTimeout(() => {
        playTurn(0, activeList, allPlayers, cards);
      }, 1000);
      return;
    }

    const orderIdx = (starterIdx + idx) % activeList.length;
    const p = activeList[orderIdx];
    setActivePlayer(p);

    const isLastBidder = idx === activeList.length - 1;
    let forbidden = -1;
    if (isLastBidder) {
      forbidden = cards - runningBidsSum;
      if (forbidden < 0 || forbidden > cards) forbidden = -1;
    }
    setForbiddenBid(forbidden);

    if (p.isHuman) {
      setMessage(isLastBidder && forbidden >= 0 
        ? `Scommetti (non puoi dire ${forbidden})`
        : 'Fai la tua scommessa');
      setIsHumanTurn(true);
    } else {
      setIsHumanTurn(false);
      setTimeout(() => {
        let bid = calculateBotBid(p, cards, activeList, cards === 1);
        
        if (isLastBidder && bid === forbidden) {
          bid = bid === 0 ? 1 : bid - 1;
        }

        p.bid = bid;
        const newBidsSum = runningBidsSum + bid;
        setCurrentBidsSum(newBidsSum);
        
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
    const newBidsSum = currentBidsSum + bid;
    setCurrentBidsSum(newBidsSum);
    setPlayers([...players]);
    setIsHumanTurn(false);

    const humanIdx = active.indexOf(human);
    const dealerPlayer = players[dealerIndex % players.length];
    const dealerIdx = active.findIndex(p => p.name === dealerPlayer.name);
    const dealerActiveIdx = dealerIdx >= 0 ? dealerIdx : 0;
    const bidIdx = (humanIdx - dealerActiveIdx + active.length) % active.length;

    setTimeout(() => {
      doBidding(bidIdx + 1, active, dealerActiveIdx, players, cardsToDeal, newBidsSum);
    }, 500);
  };

  const playTurn = (playersAlreadyPlayed, activeList, allPlayers, cards) => {
    if (playersAlreadyPlayed >= activeList.length) {
      setIsHumanTurn(false);
      cardPlayedRef.current = false;
      setTimeout(() => {
        resolveTrick(activeList, allPlayers, cards);
      }, 1000);
      return;
    }

    const currentIdx = (trickStarterIndex + playersAlreadyPlayed) % activeList.length;
    const p = activeList[currentIdx];
    setActivePlayer(p);
    setTurnPlayersPlayed(playersAlreadyPlayed);

    if (p.isHuman) {
      setIsHumanTurn(true);
      cardPlayedRef.current = false;
      setMessage('Tocca a te - Scegli una carta');
    } else {
      setIsHumanTurn(false);
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
    if (cardPlayedRef.current) return;
    
    const human = players.find((p) => p.isHuman && !p.eliminated);
    if (!human || gamePhase !== 'playing' || !isHumanTurn) return;
    
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
    const newTableCards = [...tableCards, { player, card }];
    setTableCards(newTableCards);
    setPlayers([...players]);
    setIsHumanTurn(false);

    const active = players.filter((p) => !p.eliminated);
    const nextPlayersPlayed = turnPlayersPlayed + 1;

    setTimeout(() => {
      playTurn(nextPlayersPlayed, active, players, cardsToDeal);
    }, 600);
  };

  const resolveTrick = (activeList, allPlayers, cards) => {
    if (tableCards.length === 0) {
      console.error('No table cards to resolve');
      return;
    }

    // Find the winner by comparing effective scores
    let winnerEntry = tableCards[0];
    for (let i = 1; i < tableCards.length; i++) {
      if (tableCards[i].card.effectiveScore > winnerEntry.card.effectiveScore) {
        winnerEntry = tableCards[i];
      }
    }

    // Find the player in the activeList that matches the winner using name-based matching
    // This is more robust than reference comparison since player objects may be recreated
    const winnerPlayer = activeList.find(p => p.name === winnerEntry.player.name);
    
    if (winnerPlayer) {
      winnerPlayer.taken++;
      triggerSpeech(winnerPlayer, 'WIN_TRICK');
      setMessage(`🎯 Presa di ${winnerPlayer.name}!`);
      
      // Update the trick starter for next trick
      const winnerIdx = activeList.indexOf(winnerPlayer);
      if (winnerIdx >= 0) {
        setTrickStarterIndex(winnerIdx);
      } else {
        // This should not happen since we just found the player, but handle it gracefully
        console.warn('Winner found but indexOf returned -1, keeping current trick starter');
      }
    } else {
      console.error('Winner player not found in active list');
      setMessage(`Mano completata`);
    }
    
    setPlayers([...allPlayers]);

    setTimeout(() => {
      setTableCards([]);
      setTurnPlayersPlayed(0);
      cardPlayedRef.current = false;

      const hasCardsLeft = activeList.some(p => p.hand && p.hand.length > 0);
      
      if (hasCardsLeft) {
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
      setMessage('Fine round - Tutti salvi!');
    }

    setGamePhase('roundEnd');
    
    // Move dealer to next player
    const newDealerIdx = (dealerIndex + 1) % allPlayers.length;
    setDealerIndex(newDealerIdx);

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
        startRound(allPlayers, nextCards, newDealerIdx);
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
  
  // Get bid status colors
  const getBidStatusColor = () => {
    if (!human || human.bid < 0) return COLORS.textSecondary;
    if (human.taken === human.bid) return '#00FF88';
    if (human.taken > human.bid) return '#FF4757';
    return COLORS.denari;
  };

  // Render energy bar for lives
  const renderEnergyBar = (lives, maxLives, small = false) => {
    const segments = [];
    for (let i = 0; i < maxLives; i++) {
      const isActive = i < lives;
      segments.push(
        <View 
          key={i}
          style={[
            small ? styles.energySegmentSmall : styles.energySegment,
            isActive ? styles.energyActive : styles.energyInactive,
          ]}
        />
      );
    }
    return <View style={styles.energyBar}>{segments}</View>;
  };

  return (
    <View style={styles.container}>
      {/* === HEADER === */}
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
            {isIndiana ? '🎯' : `${cardsToDeal}📄`}
          </Text>
        </View>
      </View>

      {/* === MESSAGE HUD === */}
      <View style={[styles.messageHUD, isSuddenDeath && styles.messageHUDDanger]}>
        <Text style={[styles.messageText, isSuddenDeath && styles.messageTextDanger]}>
          {message}
        </Text>
      </View>

      {/* === AREA AVVERSARI (TOP) === */}
      <View style={styles.opponentsArea}>
        <View style={styles.opponentsRow}>
          {bots.map((bot, index) => (
            <View 
              key={bot.name} 
              style={[
                styles.opponentCard,
                activePlayer === bot && styles.opponentCardActive,
                bot.eliminated && styles.opponentCardEliminated,
              ]}
            >
              {/* Dealer badge */}
              {players.indexOf(bot) === dealerIndex % players.length && (
                <View style={styles.dealerBadge}>
                  <Text style={styles.dealerBadgeText}>D</Text>
                </View>
              )}
              
              {/* Avatar */}
              <View style={[
                styles.avatarContainer,
                activePlayer === bot && styles.avatarActive,
              ]}>
                <Text style={styles.avatarEmoji}>{bot.emoji || '🎴'}</Text>
              </View>
              
              {/* Name */}
              <Text style={styles.opponentName} numberOfLines={1}>{bot.name}</Text>
              
              {/* Energy bar */}
              {renderEnergyBar(bot.lives, gameSettings.lives, true)}
              
              {/* Bid / Taken */}
              <View style={styles.opponentStats}>
                <Text style={styles.opponentBid}>
                  {bot.bid >= 0 ? `${bot.taken}/${bot.bid}` : '-'}
                </Text>
              </View>
              
              {/* Cards indicator */}
              {!bot.eliminated && bot.hand && bot.hand.length > 0 && (
                <View style={styles.cardsIndicator}>
                  {isIndiana && bot.hand[0] ? (
                    <View style={styles.miniCardVisible}>
                      <Image 
                        source={getCardImage(bot.hand[0].getImageName())}
                        style={styles.miniCardImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View style={styles.cardsStack}>
                      {bot.hand.map((_, i) => (
                        <View key={i} style={[styles.miniCardBack, { marginLeft: i * 4 }]} />
                      ))}
                    </View>
                  )}
                </View>
              )}
              
              {/* Speech bubble */}
              {speechBubble.player === bot.name && (
                <View style={styles.speechBubble}>
                  <Text style={styles.speechText}>{speechBubble.text}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* === ARENA DI GIOCO (CENTER) === */}
      <View style={styles.arenaArea}>
        <View style={styles.tableCards}>
          {tableCards.map((tc, i) => (
            <View key={i} style={styles.tableCardWrapper}>
              <Text style={styles.tableCardLabel}>{tc.player.name}</Text>
              <View style={styles.tableCardShadow}>
                <CardComponent card={tc.card} style={styles.tableCard} />
              </View>
            </View>
          ))}
        </View>
        
        {tableCards.length === 0 && gamePhase === 'playing' && (
          <Text style={styles.arenaHint}>Area di gioco</Text>
        )}
      </View>

      {/* === PLANCIA UTENTE (BOTTOM) === */}
      <View style={styles.playerArea}>
        {/* Dashboard Glass Bar */}
        <View style={styles.dashboardBar}>
          {/* Left: Lives */}
          <View style={styles.dashboardSection}>
            <Text style={styles.dashboardLabel}>VITE</Text>
            {human && renderEnergyBar(human.lives, gameSettings.lives)}
          </View>
          
          {/* Center: Player info */}
          <View style={styles.dashboardCenter}>
            {human && players.indexOf(human) === dealerIndex % players.length && (
              <View style={styles.dealerIndicator}>
                <Text style={styles.dealerIndicatorText}>MAZZIERE</Text>
              </View>
            )}
            <Text style={styles.playerNameDashboard}>{human?.name || 'Giocatore'}</Text>
          </View>
          
          {/* Right: Taken / Bid */}
          <View style={styles.dashboardSection}>
            <Text style={styles.dashboardLabel}>PRESE / OBIETTIVO</Text>
            <View style={styles.bidDisplay}>
              <Text style={[styles.bidNumber, { color: getBidStatusColor() }]}>
                {human?.taken ?? 0}
              </Text>
              <Text style={styles.bidSeparator}>/</Text>
              <Text style={styles.bidNumber}>
                {human?.bid >= 0 ? human.bid : '?'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bidding Buttons */}
        {gamePhase === 'bidding' && activePlayer?.isHuman && isHumanTurn && (
          <View style={styles.biddingContainer}>
            <Text style={styles.biddingTitle}>Quante prese farai?</Text>
            <View style={styles.bidButtons}>
              {Array.from({ length: cardsToDeal + 1 }).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.bidButton,
                    i === forbiddenBid && styles.bidButtonForbidden,
                  ]}
                  onPress={() => handlePlayerBid(i)}
                  disabled={i === forbiddenBid}
                >
                  <Text style={[
                    styles.bidButtonText,
                    i === forbiddenBid && styles.bidButtonTextForbidden,
                  ]}>
                    {i}
                  </Text>
                  {i === forbiddenBid && (
                    <View style={styles.forbiddenLine} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Player Hand */}
        {human && !human.eliminated && gamePhase !== 'gameOver' && (
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

        {/* Game Over Buttons */}
        {gamePhase === 'gameOver' && (
          <View style={styles.gameOverContainer}>
            <View style={[
              styles.gameOverBanner,
              winner?.isHuman ? styles.victoryBanner : styles.defeatBanner,
            ]}>
              <Text style={styles.gameOverEmoji}>
                {winner?.isHuman ? '🏆' : '💀'}
              </Text>
              <Text style={styles.gameOverTitle}>
                {winner?.isHuman ? 'VITTORIA!' : 'SCONFITTA'}
              </Text>
              {winner?.isHuman && (
                <Text style={styles.gameOverReward}>+{league.reward} 🪙</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.endButton}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient
                colors={winner?.isHuman ? ['#FFD700', '#FFA500'] : ['#666', '#444']}
                style={styles.endButtonGradient}
              >
                <Text style={styles.endButtonText}>
                  {winner?.isHuman ? 'RACCOGLI PREMIO' : 'TORNA AL MENU'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* === MODALS === */}
      
      {/* Jolly Choice Modal */}
      <Modal visible={showJollyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🟡 ASSO JOLLY</Text>
            <Text style={styles.modalSubtitle}>Definisci il valore della carta</Text>
            
            <TouchableOpacity
              style={[styles.jollyButton, styles.jollyMax]}
              onPress={() => handleJollyChoice(true)}
            >
              <Text style={styles.jollyButtonText}>⬆️ MAX (Vinci Tutto)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.jollyButton, styles.jollyMin]}
              onPress={() => handleJollyChoice(false)}
            >
              <Text style={styles.jollyButtonText}>⬇️ MIN (Perdi Apposta)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dealer Selection Modal */}
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
                      outputRange: [1, 1.15],
                    })},
                  ],
                },
              ]}>
                <Text style={styles.dealerAnimEmoji}>{dealerAnimationPlayer.emoji || '🎴'}</Text>
                <Text style={styles.dealerAnimName}>{dealerAnimationPlayer.name}</Text>
              </Animated.View>
            )}
            <Text style={styles.dealerModalHint}>Chi distribuirà le carte?</Text>
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
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  exitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exitText: {
    color: '#888',
    fontSize: 18,
  },
  leagueBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  leagueText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  roundBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  roundText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Message HUD
  messageHUD: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
  },
  messageHUDDanger: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    borderColor: 'rgba(255, 71, 87, 0.4)',
  },
  messageText: {
    color: COLORS.denari,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageTextDanger: {
    color: '#FF6B6B',
  },
  
  // Opponents Area
  opponentsArea: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  opponentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  opponentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    minWidth: 64,
    maxWidth: 72,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  opponentCardActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: COLORS.denari,
    shadowColor: COLORS.denari,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  opponentCardEliminated: {
    opacity: 0.3,
  },
  dealerBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    backgroundColor: COLORS.denari,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dealerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarActive: {
    borderWidth: 2,
    borderColor: COLORS.denari,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  opponentName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  opponentStats: {
    marginTop: 2,
  },
  opponentBid: {
    color: COLORS.denari,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardsIndicator: {
    marginTop: 4,
  },
  cardsStack: {
    flexDirection: 'row',
  },
  miniCardBack: {
    width: 16,
    height: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.denari,
  },
  miniCardVisible: {
    width: 24,
    height: 36,
    borderRadius: 4,
    overflow: 'hidden',
  },
  miniCardImage: {
    width: '100%',
    height: '100%',
  },
  speechBubble: {
    position: 'absolute',
    top: -32,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 100,
    zIndex: 100,
  },
  speechText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Energy Bar
  energyBar: {
    flexDirection: 'row',
    gap: 2,
  },
  energySegment: {
    width: 16,
    height: 6,
    borderRadius: 3,
  },
  energySegmentSmall: {
    width: 10,
    height: 4,
    borderRadius: 2,
  },
  energyActive: {
    backgroundColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  energyInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Arena Area
  arenaArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tableCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  tableCardWrapper: {
    alignItems: 'center',
  },
  tableCardLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tableCardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  tableCard: {
    width: 65,
    height: 97,
  },
  arenaHint: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 14,
  },
  
  // Player Area (Bottom)
  playerArea: {
    paddingBottom: 30,
    paddingTop: 10,
  },
  dashboardBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  dashboardSection: {
    alignItems: 'center',
  },
  dashboardCenter: {
    alignItems: 'center',
  },
  dashboardLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dealerIndicator: {
    backgroundColor: COLORS.denari,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  dealerIndicatorText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  playerNameDashboard: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bidDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bidNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  bidSeparator: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  
  // Bidding
  biddingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  biddingTitle: {
    color: COLORS.denari,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  bidButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  bidButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.denari,
  },
  bidButtonForbidden: {
    borderColor: 'rgba(255, 71, 87, 0.5)',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  bidButtonText: {
    color: COLORS.denari,
    fontSize: 20,
    fontWeight: 'bold',
  },
  bidButtonTextForbidden: {
    color: 'rgba(255, 71, 87, 0.5)',
  },
  forbiddenLine: {
    position: 'absolute',
    width: '120%',
    height: 2,
    backgroundColor: 'rgba(255, 71, 87, 0.6)',
    transform: [{ rotate: '-45deg' }],
  },
  
  // Hand
  handContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: 20,
  },
  fanContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  fanCardWrapper: {},
  
  // Game Over
  gameOverContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  gameOverBanner: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginBottom: 20,
  },
  victoryBanner: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: COLORS.denari,
  },
  defeatBanner: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    borderWidth: 2,
    borderColor: '#FF4757',
  },
  gameOverEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  gameOverTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  gameOverReward: {
    color: COLORS.denari,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  endButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '80%',
  },
  endButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
  },
  modalTitle: {
    color: COLORS.denari,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 24,
  },
  jollyButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
  },
  jollyMax: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderWidth: 1,
    borderColor: '#00FF88',
  },
  jollyMin: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  jollyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dealerModalContent: {
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
  },
  dealerModalTitle: {
    color: COLORS.denari,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 2,
  },
  dealerAnimCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.denari,
    alignItems: 'center',
    shadowColor: COLORS.denari,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  dealerAnimEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  dealerAnimName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  dealerModalHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 20,
  },
});

import { Card } from './card.js';
import { Deck } from './deck.js';
import { Player } from './player.js';
import { resolveTrick, type TableEntry } from './trick.js';
import { calculateRoundResults, isGameOver, getWinner } from './scoring.js';
import { calculateForbiddenBid, isValidBid } from './bidding.js';
import { EventEmitter } from 'node:events';

export type GamePhase =
  | 'WAITING'
  | 'DEALER_DRAW'
  | 'BIDDING'
  | 'PLAYING'
  | 'ROUND_END'
  | 'GAME_OVER';

export interface GameConfig {
  humanPlayerName: string;
  botNames: string[];
  initialLives: number;
  initialMaxCards: number;
  seed?: number;
}

export interface GameStateView {
  phase: GamePhase;
  cardsToDeal: number;
  roundNumber: number;
  currentBidsSum: number;
  tableCards: TableEntry[];
  players: { id: string; name: string; isHuman: boolean; lives: number; bid: number; taken: number; eliminated: boolean; handSize: number }[];
  currentPlayerId: string | null;
  roundStarterPlayerId: string | null;
  duelModeActive: boolean;
}

export class Game extends EventEmitter {
  players: Player[];
  private deck: Deck;
  private tableCards: TableEntry[];
  cardsToDeal: number;
  private delta: number;
  currentBidsSum: number;
  phase: GamePhase;
  roundNumber: number;
  private roundStarterIndex: number;
  private currentPlayerIndex: number;
  private biddingOrder: Player[];
  private biddingIdx: number;
  private playingOrder: Player[];
  private playingIdx: number;
  private initialMaxCards: number;
  private initialLives: number;
  duelModeActive: boolean;
  private seed?: number;
  private turnTimeout: number;

  constructor(config: GameConfig) {
    super();
    this.seed = config.seed;
    this.deck = new Deck(config.seed);
    this.tableCards = [];
    this.cardsToDeal = config.initialMaxCards;
    this.delta = -1;
    this.currentBidsSum = 0;
    this.phase = 'WAITING';
    this.roundNumber = 0;
    this.roundStarterIndex = 0;
    this.currentPlayerIndex = -1;
    this.biddingOrder = [];
    this.biddingIdx = 0;
    this.playingOrder = [];
    this.playingIdx = 0;
    this.initialMaxCards = config.initialMaxCards;
    this.initialLives = config.initialLives;
    this.duelModeActive = false;
    this.turnTimeout = 30_000;

    // Crea giocatori
    this.players = [
      new Player(config.humanPlayerName, true, config.initialLives),
      ...config.botNames.map(name => new Player(name, false, config.initialLives)),
    ];
  }

  // --- Avvio partita ---

  start(): { phase: GamePhase; firstDealer: Player } {
    if (this.phase !== 'WAITING') {
      throw new Error('Game already started');
    }
    this.phase = 'DEALER_DRAW';
    this.deck.create();

    // Ogni giocatore pesca 1 carta per sorteggio mazziere
    const draws: { player: Player; card: Card }[] = [];
    for (const p of this.players) {
      draws.push({ player: p, card: this.deck.draw() });
    }

    // Vince chi ha baseScore PIÙ BASSO
    let lowest = draws[0];
    for (let i = 1; i < draws.length; i++) {
      if (draws[i].card.baseScore < lowest.card.baseScore) {
        lowest = draws[i];
      }
    }

    // Determina chi inizia (il vincitore del sorteggio)
    this.roundStarterIndex = this.players.indexOf(lowest.player);

    // Passa al primo round
    this.startRound();

    return { phase: this.phase, firstDealer: lowest.player };
  }

  // --- Round ---

  private startRound(): void {
    const active = this.getActivePlayers();

    if (active.length <= 1) {
      this.phase = 'GAME_OVER';
      const winner = getWinner(this.players);
      this.emit('gameEnd', { winner: winner?.name ?? 'NESSUNO' });
      return;
    }

    // Controllo duello
    const isFinalDuel = active.length === 2 && active.some(p => p.lives === 1);
    if (isFinalDuel) {
      this.cardsToDeal = 1;
      this.duelModeActive = true;
    } else {
      // Limite fisico
      const physicalLimit = Math.floor(40 / active.length);
      if (this.cardsToDeal > physicalLimit) this.cardsToDeal = physicalLimit;
      const currentRoundMax = Math.min(this.initialMaxCards, physicalLimit);
      if (this.cardsToDeal > currentRoundMax) this.cardsToDeal = currentRoundMax;
    }

    this.roundNumber++;
    this.currentBidsSum = 0;
    this.tableCards = [];
    this.deck.create();

    // Distribuisci carte
    for (const p of active) {
      p.resetForRound();
      const cards = this.deck.drawMultiple(this.cardsToDeal);
      p.receiveCards(cards);
    }

    // Inizia bidding
    this.phase = 'BIDDING';
    const starterIdx = this.roundStarterIndex % active.length;
    this.biddingOrder = [];
    for (let i = 0; i < active.length; i++) {
      this.biddingOrder.push(active[(starterIdx + i) % active.length]);
    }
    this.biddingIdx = 0;

    this.emit('roundStart', {
      roundNumber: this.roundNumber,
      cardsToDeal: this.cardsToDeal,
      duelMode: this.duelModeActive,
      biddingOrder: this.biddingOrder.map(p => p.id),
    });
  }

  // --- Bidding ---

  getCurrentBidder(): Player | null {
    if (this.phase !== 'BIDDING' || this.biddingIdx >= this.biddingOrder.length) {
      return null;
    }
    return this.biddingOrder[this.biddingIdx];
  }

  getBiddingInfo(): { currentBidderId: string | null; allowedBids: number[]; forbiddenBid: number | null; currentBidsSum: number } {
    const bidder = this.getCurrentBidder();
    const isLast = this.biddingIdx === this.biddingOrder.length - 1;
    const forbidden = calculateForbiddenBid(this.cardsToDeal, this.currentBidsSum, isLast);

    const allowedBids: number[] = [];
    for (let i = 0; i <= this.cardsToDeal; i++) {
      if (isValidBid(i, this.cardsToDeal, forbidden)) {
        allowedBids.push(i);
      }
    }

    return {
      currentBidderId: bidder?.id ?? null,
      allowedBids,
      forbiddenBid: forbidden,
      currentBidsSum: this.currentBidsSum,
    };
  }

  makeBid(playerId: string, value: number): void {
    if (this.phase !== 'BIDDING') {
      throw new Error('Not in bidding phase');
    }

    const bidder = this.getCurrentBidder();
    if (!bidder || bidder.id !== playerId) {
      throw new Error(`Not player ${playerId}'s turn to bid`);
    }

    const isLast = this.biddingIdx === this.biddingOrder.length - 1;
    const forbidden = calculateForbiddenBid(this.cardsToDeal, this.currentBidsSum, isLast);

    if (!isValidBid(value, this.cardsToDeal, forbidden)) {
      throw new Error(`Invalid bid ${value} (forbidden: ${forbidden})`);
    }

    bidder.makeBid(value);
    this.currentBidsSum += value;
    this.biddingIdx++;

    this.emit('bidMade', { playerId, playerName: bidder.name, value });

    // Se tutti hanno dichiarato, passa alla fase di gioco
    if (this.biddingIdx >= this.biddingOrder.length) {
      this.phase = 'PLAYING';
      this.playingOrder = [...this.biddingOrder]; // stesso ordine per il primo trick
      this.playingIdx = 0;
      this.emit('playingStart', { firstPlayer: this.playingOrder[0].id });
    }
  }

  // --- Gioco ---

  getCurrentPlayer(): Player | null {
    if (this.phase !== 'PLAYING' || this.playingIdx >= this.playingOrder.length) {
      return null;
    }
    return this.playingOrder[this.playingIdx];
  }

  playCard(playerId: string, cardIndex: number, jollyChoice?: 'MAX' | 'MIN'): void {
    if (this.phase !== 'PLAYING') {
      throw new Error('Not in playing phase');
    }

    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) {
      throw new Error(`Not player ${playerId}'s turn`);
    }

    if (!player.hasCard(cardIndex)) {
      throw new Error(`Invalid card index ${cardIndex}`);
    }

    const card = player.playCard(cardIndex);

    // Gestisci jolly
    if (card.isJolly() && jollyChoice) {
      card.setJollyMode(jollyChoice === 'MAX');
    } else if (card.isJolly() && !player.isHuman) {
      // Bot: sceglie MAX se in difetto
      card.setJollyMode(player.taken < player.bid);
    }

    this.tableCards.push({ playerId: player.id, card });
    this.playingIdx++;

    this.emit('cardPlayed', {
      playerId: player.id,
      playerName: player.name,
      card: { semeName: card.semeName, valName: card.valName, isJolly: card.isJolly() },
    });

    // Se tutti hanno giocato, risolvi la presa
    if (this.playingIdx >= this.playingOrder.length) {
      this.resolveCurrentTrick();
    }
  }

  private resolveCurrentTrick(): void {
    const result = resolveTrick(this.tableCards);
    const winner = this.players.find(p => p.id === result.winnerPlayerId);
    if (!winner) throw new Error('Winner not found');

    winner.taken++;

    this.emit('trickResolved', {
      winnerId: winner.id,
      winnerName: winner.name,
    });

    // Prepara prossimo trick
    this.tableCards = [];

    // Se i giocatori hanno ancora carte, continua
    if (this.playingOrder[0].hand.length > 0) {
      // Il vincitore inizia il prossimo trick
      const active = this.getActivePlayers();
      const winnerIdx = active.indexOf(winner);
      this.playingOrder = [];
      for (let i = 0; i < active.length; i++) {
        this.playingOrder.push(active[(winnerIdx + i) % active.length]);
      }
      this.playingIdx = 0;
    } else {
      // Fine round
      this.endRound();
    }
  }

  private endRound(): void {
    const active = this.getActivePlayers();
    const results = calculateRoundResults(active);

    this.phase = 'ROUND_END';
    this.emit('roundEnd', { results, players: this.players.map(p => p.toJSON()) });

    // Controlla fine partita
    if (isGameOver(this.players)) {
      this.phase = 'GAME_OVER';
      const winner = getWinner(this.players);
      this.emit('gameEnd', {
        winner: winner?.name ?? 'NESSUNO',
        winnerId: winner?.id ?? null,
        results,
      });
      return;
    }

    // Avanza round starter
    this.roundStarterIndex++;

    // Calcola prossimo numero di carte (fisarmonica)
    this.advanceCardsToDeal();
  }

  nextRound(): void {
    if (this.phase !== 'ROUND_END') {
      throw new Error('Round not ended yet');
    }
    this.startRound();
  }

  private advanceCardsToDeal(): void {
    if (this.delta === -1) {
      this.cardsToDeal--;
      if (this.cardsToDeal < 1) {
        this.cardsToDeal = 2;
        this.delta = 1;
      }
    } else {
      this.cardsToDeal++;
      if (this.cardsToDeal > this.initialMaxCards) {
        this.cardsToDeal = this.initialMaxCards - 1;
        this.delta = -1;
      }
    }
  }

  // --- Utility ---

  getActivePlayers(): Player[] {
    return this.players.filter(p => !p.isEliminated);
  }

  getPlayerById(id: string): Player | undefined {
    return this.players.find(p => p.id === id);
  }

  getState(): GameStateView {
    const current = (this.phase === 'BIDDING' ? this.getCurrentBidder() : null)
      ?? (this.phase === 'PLAYING' ? this.getCurrentPlayer() : null);

    return {
      phase: this.phase,
      cardsToDeal: this.cardsToDeal,
      roundNumber: this.roundNumber,
      currentBidsSum: this.currentBidsSum,
      tableCards: this.tableCards,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        isHuman: p.isHuman,
        lives: p.lives,
        bid: p.bid,
        taken: p.taken,
        eliminated: p.eliminated,
        handSize: p.hand.length,
      })),
      currentPlayerId: current?.id ?? null,
      roundStarterPlayerId: this.biddingOrder[0]?.id ?? null,
      duelModeActive: this.duelModeActive,
    };
  }

  /**
   * Restituisce ciò che un giocatore PUÒ vedere.
   * In Indiana (1 carta): l'umano NON vede la propria carta.
   */
  getPlayerView(playerId: string): {
    yourHand: Card[];
    tableCards: TableEntry[];
    yourBid: number;
    yourTaken: number;
    isYourTurn: boolean;
  } {
    const player = this.getPlayerById(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);

    const isCurrent = this.getCurrentPlayer()?.id === playerId;

    return {
      // In Indiana, l'umano non vede la propria carta
      yourHand: (this.cardsToDeal === 1 && player.isHuman && this.phase === 'PLAYING')
        ? player.hand.map(c => {
            const hidden = new Card(c.valName, c.semeName);
            hidden.effectiveScore = c.effectiveScore;
            return hidden;
          })
        : [...player.hand],
      tableCards: this.tableCards,
      yourBid: player.bid,
      yourTaken: player.taken,
      isYourTurn: isCurrent,
    };
  }
}

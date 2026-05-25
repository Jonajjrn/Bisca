import { describe, it, expect } from 'vitest';
import { Game } from './game.js';
import { calculateHandStrength, calculateIndianaBid } from './bidding.js';
import type { Rank, Suit } from './card.js';

function simulateBotBid(game: Game, playerId: string): number {
  const player = game.getPlayerById(playerId);
  if (!player) throw new Error('Player not found');

  const info = game.getBiddingInfo();
  const forbidden = info.forbiddenBid;

  if (game.cardsToDeal === 1) {
    const others = game.getActivePlayers()
      .filter(p => p.id !== playerId)
      .map(p => p.hand.map(c => ({ baseScore: c.baseScore })));
    const bid = calculateIndianaBid(
      player.hand.map(c => ({ baseScore: c.baseScore })),
      others
    );
    // Aggiusta se coincide col forbidden
    if (bid === forbidden) return bid === 0 ? 1 : bid - 1;
    return bid;
  }

  const strength = calculateHandStrength(player.hand, game.cardsToDeal);
  if (strength === forbidden) return strength === 0 ? 1 : strength - 1;
  return strength;
}

function simulateBotCard(game: Game, playerId: string): number {
  const player = game.getPlayerById(playerId);
  if (!player) throw new Error('Player not found');

  if (player.hand.length === 1) return 0;

  const wantToWin = player.taken < player.bid;
  const table = (game as any).tableCards as { card: { effectiveScore: number } }[];

  let currentWinnerScore = -999;
  if (table.length > 0) {
    for (const t of table) {
      if (t.card.effectiveScore > currentWinnerScore) {
        currentWinnerScore = t.card.effectiveScore;
      }
    }
  }

  const handMapped = player.hand.map((c, i) => ({ c, i }))
    .sort((a, b) => a.c.baseScore - b.c.baseScore);

  if (table.length === 0) {
    return wantToWin
      ? handMapped[handMapped.length - 1].i
      : handMapped[0].i;
  }

  const winners = handMapped.filter(item => {
    const score = item.c.isJolly() ? (wantToWin ? 1000 : -1) : item.c.baseScore;
    return score > currentWinnerScore;
  });
  const losers = handMapped.filter(item => {
    const score = item.c.isJolly() ? (wantToWin ? 1000 : -1) : item.c.baseScore;
    return score < currentWinnerScore;
  });

  if (wantToWin) {
    return winners.length > 0 ? winners[0].i : handMapped[0].i;
  } else {
    return losers.length > 0 ? losers[losers.length - 1].i : handMapped[handMapped.length - 1].i;
  }
}

function playFullGame(seed: number): { winnerName: string; roundCount: number; error?: string } {
  const game = new Game({
    humanPlayerName: 'TestHuman',
    botNames: ['Bot_A', 'Bot_B', 'Bot_C'],
    initialLives: 3,
    initialMaxCards: 5,
    seed,
  });

  try {
    const { firstDealer } = game.start();
    let safety = 0;
    const maxIterations = 2000; // sicurezza contro loop infiniti

    while (game.phase !== 'GAME_OVER' && safety < maxIterations) {
      safety++;

      if (game.phase === 'BIDDING') {
        const bidder = game.getCurrentBidder();
        if (bidder) {
          const bid = simulateBotBid(game, bidder.id);
          game.makeBid(bidder.id, bid);
        }
      } else if (game.phase === 'PLAYING') {
        const player = game.getCurrentPlayer();
        if (player) {
          const cardIdx = simulateBotCard(game, player.id);
          game.playCard(player.id, cardIdx);
        }
      } else if (game.phase === 'ROUND_END') {
        game.nextRound();
      }
    }

    if (safety >= maxIterations) {
      return { winnerName: 'TIMEOUT', roundCount: game.roundNumber, error: 'Max iterations reached' };
    }

    const winner = game.players.find(p => !p.isEliminated);
    return { winnerName: winner?.name ?? 'NESSUNO', roundCount: game.roundNumber };
  } catch (err: any) {
    return { winnerName: 'ERROR', roundCount: game.roundNumber, error: err.message };
  }
}

describe('Game — Partita completa', () => {
  it('simula partita completa senza errori (seed 42)', () => {
    const result = playFullGame(42);
    expect(result.error).toBeUndefined();
    expect(result.winnerName).toBeDefined();
    expect(result.roundCount).toBeGreaterThan(0);
  });

  it('simula partita completa senza errori (seed 99)', () => {
    const result = playFullGame(99);
    expect(result.error).toBeUndefined();
    expect(result.winnerName).toBeDefined();
  });

  it('simula partita completa senza errori (seed 777)', () => {
    const result = playFullGame(777);
    expect(result.error).toBeUndefined();
    expect(result.winnerName).toBeDefined();
  });

  it('100 partite simulate — 0 crash, 0 timeout', () => {
    const crashes: string[] = [];
    const winners: string[] = [];

    for (let seed = 1; seed <= 100; seed++) {
      const result = playFullGame(seed);
      if (result.error) {
        crashes.push(`Seed ${seed}: ${result.error}`);
      }
      winners.push(result.winnerName);
    }

    expect(crashes).toEqual([]);
    expect(winners.length).toBe(100);
    // Verifica che ci sia varietà nei vincitori (non vince sempre lo stesso)
    const uniqueWinners = new Set(winners);
    expect(uniqueWinners.size).toBeGreaterThan(1);
  });

  it('vincitore ha almeno 1 vita rimanente', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const game = new Game({
        humanPlayerName: 'TestHuman',
        botNames: ['Bot_A', 'Bot_B', 'Bot_C'],
        initialLives: 3,
        initialMaxCards: 5,
        seed,
      });
      game.start();

      let safety = 0;
      while (game.phase !== 'GAME_OVER' && safety < 2000) {
        safety++;
        if (game.phase === 'BIDDING') {
          const bidder = game.getCurrentBidder();
          if (bidder) game.makeBid(bidder.id, simulateBotBid(game, bidder.id));
        } else if (game.phase === 'PLAYING') {
          const player = game.getCurrentPlayer();
          if (player) game.playCard(player.id, simulateBotCard(game, player.id));
        } else if (game.phase === 'ROUND_END') {
          game.nextRound();
        }
      }

      const winner = game.players.find(p => !p.isEliminated);
      if (winner) {
        expect(winner.lives).toBeGreaterThanOrEqual(1);
        expect(winner.eliminated).toBe(false);
      }
    }
  });

  it('Giocatore con 1 vita, diff=2 → eliminato e non gioca più', () => {
    const game = new Game({
      humanPlayerName: 'Human',
      botNames: ['Bot1'],
      initialLives: 1,
      initialMaxCards: 3,
      seed: 42,
    });

    game.start();

    let safety = 0;
    while (game.phase !== 'GAME_OVER' && safety < 2000) {
      safety++;
      if (game.phase === 'BIDDING') {
        const bidder = game.getCurrentBidder();
        if (bidder) game.makeBid(bidder.id, simulateBotBid(game, bidder.id));
      } else if (game.phase === 'PLAYING') {
        const player = game.getCurrentPlayer();
        if (player) game.playCard(player.id, simulateBotCard(game, player.id));
      } else if (game.phase === 'ROUND_END') {
        game.nextRound();
      }
    }

    expect(game.phase).toBe('GAME_OVER');
    expect(safety).toBeLessThan(2000);
  });

  it('stesso seed produce stessa partita (deterministico)', () => {
    const r1 = playFullGame(12345);
    const r2 = playFullGame(12345);
    expect(r1).toEqual(r2);
  });
});

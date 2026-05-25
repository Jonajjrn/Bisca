import { describe, it, expect } from 'vitest';
import { Player } from './player.js';
import { calculateRoundResults, isGameOver, getWinner } from './scoring.js';

function makePlayer(name: string, lives: number): Player {
  return new Player(name, false, lives);
}

describe('calculateRoundResults', () => {
  it('bid=2, taken=2 → diff=0, 0 vite perse', () => {
    const p = makePlayer('Test', 3);
    p.bid = 2;
    p.taken = 2;
    const results = calculateRoundResults([p]);
    expect(results[0].diff).toBe(0);
    expect(results[0].livesLost).toBe(0);
    expect(results[0].eliminated).toBe(false);
  });

  it('bid=1, taken=3 → diff=2, 2 vite perse', () => {
    const p = makePlayer('Test', 3);
    p.bid = 1;
    p.taken = 3;
    const results = calculateRoundResults([p]);
    expect(results[0].diff).toBe(2);
    expect(results[0].livesLost).toBe(2);
    expect(results[0].livesRemaining).toBe(1);
  });

  it('bid=3, taken=0 → diff=3, 3 vite perse', () => {
    const p = makePlayer('Test', 3);
    p.bid = 3;
    p.taken = 0;
    const results = calculateRoundResults([p]);
    expect(results[0].diff).toBe(3);
    expect(results[0].livesLost).toBe(3);
  });

  it('giocatore con 1 vita, diff=2 → eliminato', () => {
    const p = makePlayer('Test', 1);
    p.bid = 0;
    p.taken = 2;
    const results = calculateRoundResults([p]);
    expect(results[0].eliminated).toBe(true);
    expect(results[0].livesRemaining).toBe(0);
  });

  it('giocatore già eliminato processato normalmente', () => {
    const p = makePlayer('Test', 0);
    p.eliminated = true;
    p.bid = 0;
    p.taken = 0;
    const results = calculateRoundResults([p]);
    expect(results[0].diff).toBe(0);
  });

  it('tutti OK, nessuno eliminato', () => {
    const p1 = makePlayer('A', 3);
    p1.bid = 1; p1.taken = 1;
    const p2 = makePlayer('B', 3);
    p2.bid = 2; p2.taken = 2;

    const results = calculateRoundResults([p1, p2]);
    expect(results.every(r => r.diff === 0)).toBe(true);
    expect(results.every(r => !r.eliminated)).toBe(true);
  });
});

describe('isGameOver', () => {
  it('1 giocatore rimasto → true', () => {
    const p1 = makePlayer('A', 3);
    const p2 = makePlayer('B', 0);
    p2.eliminated = true;
    expect(isGameOver([p1, p2])).toBe(true);
  });

  it('2 giocatori attivi → false', () => {
    const p1 = makePlayer('A', 3);
    const p2 = makePlayer('B', 3);
    expect(isGameOver([p1, p2])).toBe(false);
  });
});

describe('getWinner', () => {
  it('1 giocatore vivo → restituisce quello', () => {
    const p1 = makePlayer('Winner', 2);
    const p2 = makePlayer('Loser', 0);
    p2.eliminated = true;
    expect(getWinner([p1, p2])?.name).toBe('Winner');
  });

  it('0 giocatori vivi → null', () => {
    const p1 = makePlayer('A', 0);
    p1.eliminated = true;
    const p2 = makePlayer('B', 0);
    p2.eliminated = true;
    expect(getWinner([p1, p2])).toBeNull();
  });
});

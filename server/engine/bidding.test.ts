import { describe, it, expect } from 'vitest';
import { calculateForbiddenBid, isValidBid, calculateHandStrength, calculateIndianaBid } from './bidding.js';
import { Card } from './card.js';
import type { Rank, Suit } from './card.js';

describe('calculateForbiddenBid', () => {
  it('4 carte, somma=2, ultimo giocatore → forbidden=2', () => {
    expect(calculateForbiddenBid(4, 2, true)).toBe(2);
  });

  it('4 carte, somma=2, NON ultimo → null', () => {
    expect(calculateForbiddenBid(4, 2, false)).toBeNull();
  });

  it('4 carte, somma=5, ultimo → null (overflow)', () => {
    expect(calculateForbiddenBid(4, 5, true)).toBeNull();
  });

  it('5 carte, somma=0, ultimo → forbidden=5', () => {
    expect(calculateForbiddenBid(5, 0, true)).toBe(5);
  });
});

describe('isValidBid', () => {
  it('bid 2 con max 4, forbidden=3 → valido', () => {
    expect(isValidBid(2, 4, 3)).toBe(true);
  });

  it('bid 3 con max 4, forbidden=3 → invalido', () => {
    expect(isValidBid(3, 4, 3)).toBe(false);
  });

  it('bid 5 con max 4 → invalido (fuori range)', () => {
    expect(isValidBid(5, 4, null)).toBe(false);
  });

  it('bid -1 → invalido', () => {
    expect(isValidBid(-1, 4, null)).toBe(false);
  });

  it('bid 0 → valido', () => {
    expect(isValidBid(0, 4, null)).toBe(true);
  });

  it('bid con decimali → invalido', () => {
    expect(isValidBid(2.5, 4, null)).toBe(false);
  });
});

describe('calculateHandStrength', () => {
  it('mano vuota → forza 0', () => {
    expect(calculateHandStrength([], 5)).toBe(0);
  });

  it('mano con jolly → forza >= 1', () => {
    const hand = [new Card('A' as Rank, 'Denari' as Suit)]; // jolly
    expect(calculateHandStrength(hand, 5)).toBe(1);
  });

  it('mano con carte forti (>=305) → forza alta', () => {
    const hand = [
      new Card('5' as Rank, 'Denari' as Suit),   // 304
      new Card('6' as Rank, 'Denari' as Suit),   // 305
      new Card('Re' as Rank, 'Denari' as Suit),  // 309
    ];
    const s = calculateHandStrength(hand, 5);
    expect(s).toBe(3); // 304(media=+0.7) + 305(forte=+1) + 309(forte=+1) = 2.7 → round 3
  });

  it('forza non supera cardsToDeal', () => {
    const hand = Array(6).fill(new Card('Re' as Rank, 'Denari' as Suit));
    expect(calculateHandStrength(hand, 3)).toBeLessThanOrEqual(3);
  });
});

describe('calculateIndianaBid', () => {
  it('nessun pericolo (tutti < 280) → bid 1', () => {
    const myHand = [{ baseScore: 100 }];
    const others = [
      [{ baseScore: 200 }],
      [{ baseScore: 50 }],
    ];
    expect(calculateIndianaBid(myHand, others)).toBe(1);
  });

  it('pericolo rilevato (qualcuno >= 280) → bid 0', () => {
    const myHand = [{ baseScore: 100 }];
    const others = [
      [{ baseScore: 290 }],
    ];
    expect(calculateIndianaBid(myHand, others)).toBe(0);
  });

  it('mano vuota → bid 0', () => {
    expect(calculateIndianaBid([], [])).toBe(0);
  });
});

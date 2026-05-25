import { describe, it, expect } from 'vitest';
import { Player } from './player.js';
import { Card } from './card.js';
import type { Rank, Suit } from './card.js';

describe('Player', () => {
  it('crea giocatore con campi corretti', () => {
    const p = new Player('TestPlayer', true, 3);
    expect(p.name).toBe('TestPlayer');
    expect(p.isHuman).toBe(true);
    expect(p.lives).toBe(3);
    expect(p.hand).toEqual([]);
    expect(p.bid).toBe(-1);
    expect(p.taken).toBe(0);
    expect(p.eliminated).toBe(false);
    expect(p.id).toBeDefined();
  });

  it('due giocatori hanno ID diversi', () => {
    const p1 = new Player('A', true, 3);
    const p2 = new Player('B', false, 3);
    expect(p1.id).not.toBe(p2.id);
  });

  it('resetForRound() pulisce mano, bid, taken', () => {
    const p = new Player('Test', true, 3);
    p.hand = [new Card('Re' as Rank, 'Denari' as Suit)];
    p.bid = 2;
    p.taken = 1;

    p.resetForRound();

    expect(p.hand).toEqual([]);
    expect(p.bid).toBe(-1);
    expect(p.taken).toBe(0);
  });

  it('receiveCards ordina la mano per baseScore crescente', () => {
    const p = new Player('Test', true, 3);
    const cards = [
      new Card('Re' as Rank, 'Denari' as Suit),    // 309
      new Card('A' as Rank, 'Bastoni' as Suit),    // 0
      new Card('7' as Rank, 'Coppe' as Suit),      // 206 (2*100+6)
    ];
    p.receiveCards(cards);
    expect(p.hand.length).toBe(3);
    expect(p.hand[0].baseScore).toBeLessThanOrEqual(p.hand[1].baseScore);
    expect(p.hand[1].baseScore).toBeLessThanOrEqual(p.hand[2].baseScore);
  });

  it('receiveCards non ordina se una sola carta', () => {
    const p = new Player('Test', true, 3);
    p.receiveCards([new Card('Re' as Rank, 'Denari' as Suit)]);
    expect(p.hand.length).toBe(1);
  });

  it('playCard rimuove la carta e la restituisce', () => {
    const p = new Player('Test', true, 3);
    const asso = new Card('A' as Rank, 'Bastoni' as Suit);  // baseScore 0
    const re = new Card('Re' as Rank, 'Denari' as Suit);     // baseScore 309
    p.receiveCards([re, asso]);
    // La mano viene ordinata: [asso (0), re (309)]

    const played = p.playCard(1); // prendo il Re
    expect(played).toBe(re);
    expect(p.hand.length).toBe(1);
  });

  it('playCard con indice invalido lancia errore', () => {
    const p = new Player('Test', true, 3);
    p.receiveCards([new Card('Re' as Rank, 'Denari' as Suit)]);
    expect(() => p.playCard(5)).toThrow('Invalid card index');
    expect(() => p.playCard(-1)).toThrow('Invalid card index');
  });

  it('hasCard verifica indice valido', () => {
    const p = new Player('Test', true, 3);
    p.receiveCards([new Card('Re' as Rank, 'Denari' as Suit), new Card('A' as Rank, 'Bastoni' as Suit)]);
    expect(p.hasCard(0)).toBe(true);
    expect(p.hasCard(1)).toBe(true);
    expect(p.hasCard(2)).toBe(false);
    expect(p.hasCard(-1)).toBe(false);
  });

  it('isEliminated true se lives <= 0', () => {
    const p = new Player('Test', true, 1);
    expect(p.isEliminated).toBe(false);
    p.loseLives(1);
    expect(p.lives).toBe(0);
    expect(p.isEliminated).toBe(true);
    expect(p.eliminated).toBe(true);
  });

  it('loseLives non va sotto zero', () => {
    const p = new Player('Test', true, 1);
    p.loseLives(5);
    expect(p.lives).toBe(0);
  });
});

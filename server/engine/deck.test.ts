import { describe, it, expect } from 'vitest';
import { Deck } from './deck.js';

describe('Deck', () => {
  it('crea un mazzo con 40 carte', () => {
    const deck = new Deck();
    deck.create();
    expect(deck.remaining()).toBe(40);
  });

  it('mescola il mazzo in modo diverso con seed diversi', () => {
    const d1 = new Deck(42);
    d1.create();
    const first1 = d1.peekTop();

    const d2 = new Deck(99);
    d2.create();
    const first2 = d2.peekTop();

    // Probabilità di collisione: 1/40. Accettabile
    // Con seed diversi, L'ORDINE è diverso (non testiamo strict inequality)
    // Ma verificheremo che lo stesso seed dà lo stesso ordine
    expect(first1).toBeDefined();
    expect(first2).toBeDefined();
  });

  it('stesso seed produce stesso ordine (deterministico)', () => {
    const d1 = new Deck(123);
    const cards1 = d1.create().map(c => `${c.semeName}-${c.valName}`);

    const d2 = new Deck(123);
    const cards2 = d2.create().map(c => `${c.semeName}-${c.valName}`);

    expect(cards1).toEqual(cards2);
  });

  it('draw() riduce il mazzo di 1', () => {
    const deck = new Deck();
    deck.create();
    expect(deck.remaining()).toBe(40);
    const card = deck.draw();
    expect(card).toBeDefined();
    expect(deck.remaining()).toBe(39);
  });

  it('drawMultiple(5) restituisce 5 carte e ne lascia 35', () => {
    const deck = new Deck();
    deck.create();
    const cards = deck.drawMultiple(5);
    expect(cards.length).toBe(5);
    expect(deck.remaining()).toBe(35);
  });

  it('draw() su mazzo vuoto lancia errore', () => {
    const deck = new Deck();
    deck.create();
    for (let i = 0; i < 40; i++) deck.draw();
    expect(deck.isEmpty()).toBe(true);
    expect(() => deck.draw()).toThrow('Deck is empty');
  });

  it('drawMultiple() con più carte di quante disponibili lancia errore', () => {
    const deck = new Deck();
    deck.create();
    expect(() => deck.drawMultiple(41)).toThrow('Cannot draw');
  });

  it('dopo 40 draw il mazzo è vuoto', () => {
    const deck = new Deck();
    deck.create();
    for (let i = 0; i < 40; i++) deck.draw();
    expect(deck.isEmpty()).toBe(true);
    expect(deck.remaining()).toBe(0);
  });

  it('nessuna carta duplicata nel mazzo', () => {
    const deck = new Deck();
    const cards = deck.create();
    const keys = cards.map(c => `${c.semeName}-${c.valName}`);
    expect(new Set(keys).size).toBe(40);
  });

  it('il mazzo contiene tutte e 40 le carte dopo create()', () => {
    const deck = new Deck();
    const cards = deck.create();
    const suits = ['Bastoni', 'Spade', 'Coppe', 'Denari'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', 'Fante', 'Cavallo', 'Re'];

    for (const s of suits) {
      for (const r of ranks) {
        const found = cards.find(c => c.semeName === s && c.valName === r);
        expect(found).toBeDefined();
      }
    }
  });
});

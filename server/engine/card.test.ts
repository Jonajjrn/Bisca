import { describe, it, expect } from 'vitest';
import { Card } from './card.js';
import type { Rank, Suit } from './card.js';

describe('Card', () => {
  it('Re di Denari ha baseScore 309 (massimo: 3*100+9)', () => {
    const c = new Card('Re' as Rank, 'Denari' as Suit);
    expect(c.baseScore).toBe(309);
    expect(c.effectiveScore).toBe(309);
  });

  it('Asso di Bastoni ha baseScore 0 (minimo)', () => {
    const c = new Card('A' as Rank, 'Bastoni' as Suit);
    expect(c.baseScore).toBe(0);
  });

  it('Asso di Denari è jolly', () => {
    const c = new Card('A' as Rank, 'Denari' as Suit);
    expect(c.isJolly()).toBe(true);
  });

  it('Re di Spade NON è jolly', () => {
    const c = new Card('Re' as Rank, 'Spade' as Suit);
    expect(c.isJolly()).toBe(false);
  });

  it('setJollyMode(true) imposta effectiveScore a 1000', () => {
    const c = new Card('A' as Rank, 'Denari' as Suit);
    c.setJollyMode(true);
    expect(c.effectiveScore).toBe(1000);
    expect(c.baseScore).toBe(300); // invariato
  });

  it('setJollyMode(false) imposta effectiveScore a -1', () => {
    const c = new Card('A' as Rank, 'Denari' as Suit);
    c.setJollyMode(false);
    expect(c.effectiveScore).toBe(-1);
  });

  it('resetScore ripristina effectiveScore a baseScore', () => {
    const c = new Card('Cavallo' as Rank, 'Coppe' as Suit);
    c.setJollyMode(true);
    expect(c.effectiveScore).toBe(1000);
    c.resetScore();
    expect(c.effectiveScore).toBe(c.baseScore);
  });

  it('getImagePath restituisce percorso corretto per Asso di Bastoni', () => {
    const c = new Card('A' as Rank, 'Bastoni' as Suit);
    expect(c.getImagePath()).toBe('img/bastoni1.png');
  });

  it('getImagePath restituisce percorso corretto per Re di Denari', () => {
    const c = new Card('Re' as Rank, 'Denari' as Suit);
    expect(c.getImagePath()).toBe('img/denari10.png');
  });

  it('getImagePath restituisce percorso corretto per Fante di Spade', () => {
    const c = new Card('Fante' as Rank, 'Spade' as Suit);
    expect(c.getImagePath()).toBe('img/spade8.png');
  });

  it('Denari 2 (301) batte Coppe Re (209) per gerarchia semi', () => {
    const denari2 = new Card('2' as Rank, 'Denari' as Suit);
    const coppeRe = new Card('Re' as Rank, 'Coppe' as Suit);
    expect(denari2.baseScore).toBe(301); // 3*100+1
    expect(coppeRe.baseScore).toBe(209); // 2*100+9
    expect(denari2.baseScore).toBeGreaterThan(coppeRe.baseScore);
  });

  it('Re di Bastoni (9) batte Asso di Bastoni (0) stesso seme', () => {
    const re = new Card('Re' as Rank, 'Bastoni' as Suit);
    const asso = new Card('A' as Rank, 'Bastoni' as Suit);
    expect(re.baseScore).toBeGreaterThan(asso.baseScore);
  });

  it('valIdx e semeIdx sono corretti per tutte le carte', () => {
    const c = new Card('7' as Rank, 'Spade' as Suit);
    expect(c.valIdx).toBe(6); // '7' è al 7° posto (0-based = 6)
    expect(c.semeIdx).toBe(1); // Spade è indice 1
  });

  it('40 carte uniche nel mazzo completo', () => {
    const suits: Suit[] = ['Bastoni', 'Spade', 'Coppe', 'Denari'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', 'Fante', 'Cavallo', 'Re'];
    const cards = suits.flatMap(s => ranks.map(r => new Card(r, s)));
    expect(cards.length).toBe(40);

    const keys = cards.map(c => `${c.semeName}-${c.valName}`);
    expect(new Set(keys).size).toBe(40); // tutte uniche
  });
});

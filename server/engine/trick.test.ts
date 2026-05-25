import { describe, it, expect } from 'vitest';
import { resolveTrick, type TableEntry } from './trick.js';
import { Card } from './card.js';
import type { Rank, Suit } from './card.js';

function entry(playerId: string, rank: Rank, suit: Suit): TableEntry {
  return { playerId, card: new Card(rank, suit) };
}

describe('resolveTrick', () => {
  it('Re di Denari (309) batte Re di Coppe (209)', () => {
    const table: TableEntry[] = [
      entry('p2', 'Re', 'Coppe'),
      entry('p1', 'Re', 'Denari'),
    ];
    const r = resolveTrick(table);
    expect(r.winnerPlayerId).toBe('p1');
  });

  it('Asso di Bastoni (0) perde contro qualsiasi carta', () => {
    const table: TableEntry[] = [
      entry('p1', 'A', 'Bastoni'),
      entry('p2', '2', 'Bastoni'),
    ];
    const r = resolveTrick(table);
    expect(r.winnerPlayerId).toBe('p2');
  });

  it('Jolly MAX (1000) batte qualsiasi carta', () => {
    const table: TableEntry[] = [
      entry('p1', 'Re', 'Denari'),   // 309
      entry('p2', 'Re', 'Coppe'),    // 209
    ];
    const jolly = new Card('A' as Rank, 'Denari' as Suit);
    jolly.setJollyMode(true); // 1000
    table.push({ playerId: 'p3', card: jolly });

    const r = resolveTrick(table);
    expect(r.winnerPlayerId).toBe('p3');
  });

  it('Jolly MIN (-1) perde contro Asso di Bastoni (0)', () => {
    const jolly = new Card('A' as Rank, 'Denari' as Suit);
    jolly.setJollyMode(false); // -1
    const table: TableEntry[] = [
      { playerId: 'p1', card: jolly },
      entry('p2', 'A', 'Bastoni'),   // 0
    ];
    const r = resolveTrick(table);
    expect(r.winnerPlayerId).toBe('p2');
  });

  it('Due carte stesso seme: valore più alto vince', () => {
    const table: TableEntry[] = [
      entry('p1', '3', 'Spade'),     // 102
      entry('p2', 'Re', 'Spade'),    // 109
    ];
    const r = resolveTrick(table);
    expect(r.winnerPlayerId).toBe('p2');
  });

  it('Denari 2 (301) batte Coppe Re (209) per gerarchia semi', () => {
    const table: TableEntry[] = [
      entry('p1', 'Re', 'Coppe'),    // 209
      entry('p2', '2', 'Denari'),    // 301
    ];
    const r = resolveTrick(table);
    expect(r.winnerPlayerId).toBe('p2');
  });

  it('Tavolo con 4 carte: determina vincitore corretto', () => {
    const table: TableEntry[] = [
      entry('p1', '5', 'Bastoni'),   // 4
      entry('p2', 'Re', 'Spade'),    // 109
      entry('p3', '7', 'Coppe'),     // 206
      entry('p4', 'Cavallo', 'Denari'), // 308
    ];
    const r = resolveTrick(table);
    expect(r.winnerPlayerId).toBe('p4');
  });

  it('Tavolo vuoto lancia errore', () => {
    expect(() => resolveTrick([])).toThrow('Cannot resolve empty table');
  });

  it('Parità: vince la prima carta giocata', () => {
    // Due carte identiche (stesso seme e valore): impossibile nel gioco reale
    // ma testiamo il comportamento
    const table: TableEntry[] = [
      entry('p1', 'Re', 'Denari'),
      entry('p2', 'Re', 'Denari'), // non può esistere ma testiamo
    ];
    const r = resolveTrick(table);
    expect(r.winnerPlayerId).toBe('p1'); // primo giocato
  });
});

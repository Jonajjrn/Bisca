import { Card, type Suit, type Rank } from './card.js';

const SUITS: Suit[] = ['Bastoni', 'Spade', 'Coppe', 'Denari'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', 'Fante', 'Cavallo', 'Re'];

// Mulberry32 PRNG — deterministico se seedato, per test riproducibili
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class Deck {
  private cards: Card[];
  private rng: () => number;

  constructor(seed?: number) {
    this.cards = [];
    this.rng = seed !== undefined ? mulberry32(seed) : Math.random;
  }

  create(): Card[] {
    this.cards = [];
    for (const s of SUITS) {
      for (const v of RANKS) {
        this.cards.push(new Card(v, s));
      }
    }
    this.shuffle();
    return [...this.cards];
  }

  shuffle(): void {
    // Fisher-Yates shuffle con PRNG
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(): Card {
    const c = this.cards.pop();
    if (!c) throw new Error('Deck is empty');
    return c;
  }

  drawMultiple(n: number): Card[] {
    if (n > this.cards.length) {
      throw new Error(`Cannot draw ${n} cards, only ${this.cards.length} remaining`);
    }
    const drawn: Card[] = [];
    for (let i = 0; i < n; i++) {
      drawn.push(this.draw());
    }
    return drawn;
  }

  remaining(): number {
    return this.cards.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  peekTop(): Card | undefined {
    return this.cards[this.cards.length - 1];
  }
}

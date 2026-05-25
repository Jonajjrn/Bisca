import { Card } from './card.js';

let idCounter = 0;

export class Player {
  readonly id: string;
  name: string;
  readonly isHuman: boolean;
  lives: number;
  hand: Card[];
  bid: number;
  taken: number;
  eliminated: boolean;

  constructor(name: string, isHuman: boolean, lives: number, id?: string) {
    this.id = id ?? `player_${++idCounter}_${Date.now()}`;
    this.name = name;
    this.isHuman = isHuman;
    this.lives = lives;
    this.hand = [];
    this.bid = -1;
    this.taken = 0;
    this.eliminated = false;
  }

  get isEliminated(): boolean {
    return this.eliminated || this.lives <= 0;
  }

  resetForRound(): void {
    this.hand = [];
    this.bid = -1;
    this.taken = 0;
  }

  receiveCards(cards: Card[]): void {
    this.hand = [...cards];
    if (this.hand.length > 1) {
      this.hand.sort((a, b) => a.baseScore - b.baseScore);
    }
  }

  playCard(index: number): Card {
    if (index < 0 || index >= this.hand.length) {
      throw new Error(`Invalid card index ${index}, hand has ${this.hand.length} cards`);
    }
    const [card] = this.hand.splice(index, 1);
    return card;
  }

  hasCard(index: number): boolean {
    return index >= 0 && index < this.hand.length;
  }

  makeBid(value: number): void {
    this.bid = value;
  }

  loseLives(amount: number): void {
    this.lives = Math.max(0, this.lives - amount);
    if (this.lives <= 0) {
      this.eliminated = true;
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isHuman: this.isHuman,
      lives: this.lives,
      handSize: this.hand.length,
      bid: this.bid,
      taken: this.taken,
      eliminated: this.eliminated,
    };
  }
}

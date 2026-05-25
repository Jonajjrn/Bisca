// Tipi e costanti locali (auto-contenuti, nessuna dipendenza esterna)
// Questi valori sono estratti da index.html e corrispondono ESATTAMENTE alla logica originale

export type Suit = 'Bastoni' | 'Spade' | 'Coppe' | 'Denari';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | 'Fante' | 'Cavallo' | 'Re';

// Ordine critico: determina la gerarchia. NON riordinare.
const SUIT_INDEX: Record<Suit, number> = { Bastoni: 0, Spade: 1, Coppe: 2, Denari: 3 };
const RANK_INDEX: Record<Rank, number> = {
  A: 0, '2': 1, '3': 2, '4': 3, '5': 4,
  '6': 5, '7': 6, Fante: 7, Cavallo: 8, Re: 9,
};
const RANK_TO_FILE_NUM: Record<Rank, number> = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, Fante: 8, Cavallo: 9, Re: 10,
};

const JOLLY_MAX = 1000;
const JOLLY_MIN = -1;

export class Card {
  readonly valName: Rank;
  readonly semeName: Suit;
  readonly valIdx: number;
  readonly semeIdx: number;
  readonly baseScore: number;
  effectiveScore: number;

  constructor(val: Rank, sem: Suit) {
    this.valName = val;
    this.semeName = sem;
    this.valIdx = RANK_INDEX[val];
    this.semeIdx = SUIT_INDEX[sem];
    this.baseScore = this.semeIdx * 100 + this.valIdx;
    this.effectiveScore = this.baseScore;
  }

  isJolly(): boolean {
    return this.valName === 'A' && this.semeName === 'Denari';
  }

  setJollyMode(isMax: boolean): void {
    this.effectiveScore = isMax ? JOLLY_MAX : JOLLY_MIN;
  }

  resetScore(): void {
    this.effectiveScore = this.baseScore;
  }

  getImagePath(): string {
    const num = RANK_TO_FILE_NUM[this.valName];
    return `img/${this.semeName.toLowerCase()}${num}.png`;
  }
}

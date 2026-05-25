// Costanti condivise per BiscaWeb
// Questi valori devono corrispondere ESATTAMENTE alla logica in index.html

import type { Suit, Rank, RankValue } from './types.js';

// --- Semi (ordinati per gerarchia crescente) ---
// Bastoni = più debole, Denari = più forte
// USATO per calcolare baseScore = semeIdx * 100 + valIdx
export const SUITS: Suit[] = ['Bastoni', 'Spade', 'Coppe', 'Denari'];

// --- Valori (ordinati per gerarchia crescente) ---
// Asso = più debole (valIdx=0), Re = più forte (valIdx=9)
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', 'Fante', 'Cavallo', 'Re'];

// --- Mappa valore → indice (per lookup veloce) ---
export const SUIT_INDEX: Record<Suit, number> = {
  Bastoni: 0,
  Spade: 1,
  Coppe: 2,
  Denari: 3,
};

export const RANK_INDEX: Record<Rank, number> = {
  A: 0, '2': 1, '3': 2, '4': 3, '5': 4,
  '6': 5, '7': 6, Fante: 7, Cavallo: 8, Re: 9,
};

// --- Mappa valore → numero per nome file immagine ---
// Es: "Fante" → 8, "Re" → 10
export const RANK_TO_FILE_NUM: Record<Rank, RankValue> = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, Fante: 8, Cavallo: 9, Re: 10,
};

// --- Dimensioni mazzo ---
export const TOTAL_CARDS = 40; // 4 semi × 10 valori

// --- Limiti giocatori ---
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 7;

// --- Punteggi speciali ---
export const JOLLY_MAX_SCORE = 1000;  // Il jolly in modalità MAX
export const JOLLY_MIN_SCORE = -1;     // Il jolly in modalità MIN

// --- Soglie IA bot (hardcodate da index.html) ---
export const BOT_DANGER_THRESHOLD = 280;   // Indiana: se qualcuno ha carta >= 280, non dichiarare
export const BOT_HIGH_CARD_THRESHOLD = 305; // Carta "forte": baseScore >= 305
export const BOT_MEDIUM_CARD_THRESHOLD = 208; // Carta "media": baseScore >= 208
export const BOT_MEDIUM_CARD_WEIGHT = 0.7;    // Peso per carta media

// --- Probabilità dialoghi bot ---
export const CHAT_PROB_STANDARD = 0.4;
export const CHAT_PROB_MAO = 0.95;
export const CHAT_PROB_ELIMINATION = 1.0;

// --- Timing (millisecondi) ---
export const TIMING_SORTEGGIO_DELAY = 600;
export const TIMING_BOT_DELAY = 800;
export const TIMING_TRICK_DISPLAY = 2000;
export const TIMING_ELIMINATION_DISPLAY = 3500;
export const TIMING_BUBBLE_DISPLAY = 3000;
export const TIMING_DEALER_SHOW = 3000;
export const TIMING_DUEL_TRANSITION = 3000;
export const TIMING_ROUND_LABEL = 2000;

// --- Pattern round (fisarmonica) ---
export const CARDS_DECREASING_PHASE = -1; // delta quando scende
export const CARDS_INCREASING_PHASE = 1;   // delta quando sale

// --- Configurazione default ---
export const DEFAULT_LIVES = 3;
export const DEFAULT_MAX_CARDS = 5;
export const DEFAULT_BOT_COUNT = 3;

// --- Lobby ---
export const INVITE_CODE_LENGTH = 6;
export const AUTOFILL_TIMER_SECONDS = 45;
export const RECONNECT_TIMEOUT_SECONDS = 60;
export const TURN_TIMEOUT_SECONDS = 30;

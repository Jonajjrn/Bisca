import { Card } from './card.js';

export interface TableEntry {
  playerId: string;
  card: Card;
}

export interface TrickResult {
  winnerPlayerId: string;
  winningCard: Card;
}

/**
 * Risolve una presa: confronta tutte le carte giocate e determina il vincitore.
 * La gerarchia è basata su card.effectiveScore:
 *   - Jolly MAX = 1000 (vince sempre)
 *   - Jolly MIN = -1 (perde sempre)
 *   - Altrimenti: semeIdx*100 + valIdx (Denari > Coppe > Spade > Bastoni)
 * In caso di parità, vince la prima carta giocata (prima nell'array).
 */
export function resolveTrick(tableCards: TableEntry[]): TrickResult {
  if (tableCards.length === 0) {
    throw new Error('Cannot resolve empty table');
  }

  let winner = tableCards[0];
  for (let i = 1; i < tableCards.length; i++) {
    if (tableCards[i].card.effectiveScore > winner.card.effectiveScore) {
      winner = tableCards[i];
    }
  }

  return {
    winnerPlayerId: winner.playerId,
    winningCard: winner.card,
  };
}

/**
 * Verifica se una carta è giocabile date le regole.
 * Nella versione attuale NON c'è obbligo di rispondere al seme,
 * quindi qualsiasi carta nella mano è giocabile.
 *
 * TODO: implementare regola del palo (seme) come opzione configurabile.
 */
export function isPlayableCard(
  card: Card,
  hand: Card[],
  tableCards: TableEntry[],
  _strictSuitRule: boolean = false,
): boolean {
  // Senza regola del palo: tutto è giocabile
  if (!_strictSuitRule) {
    return hand.some(h => h === card);
  }

  // TODO: Con regola del palo:
  // Se sei il primo a giocare (tableCards vuoto): qualsiasi carta
  // Altrimenti: DEVI giocare una carta dello stesso seme del primo,
  // se ne hai. Se non ne hai, puoi giocare qualsiasi cosa.
  return hand.some(h => h === card);
}

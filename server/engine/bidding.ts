/**
 * Calcola il "forbidden bid" per l'ultimo giocatore.
 * Regola: l'ultimo giocatore non può dichiarare un numero
 * che faccia tornare i conti esatti (currentBidsSum + bid == cardsToDeal).
 *
 * @returns Il numero vietato, o null se nessun vincolo.
 */
export function calculateForbiddenBid(
  cardsToDeal: number,
  currentBidsSum: number,
  isLastBidder: boolean,
): number | null {
  if (!isLastBidder) return null;

  const forbidden = cardsToDeal - currentBidsSum;
  // Se la somma corrente eccede già cardsToDeal, nessun vincolo
  if (forbidden < 0) return null;

  return forbidden;
}

/**
 * Valida se un bid è legale.
 * @returns true se valido, false altrimenti.
 */
export function isValidBid(
  value: number,
  cardsToDeal: number,
  forbiddenBid: number | null,
): boolean {
  if (value < 0 || value > cardsToDeal) return false;
  if (!Number.isInteger(value)) return false;
  if (forbiddenBid !== null && value === forbiddenBid) return false;
  return true;
}

/**
 * Calcola la forza di una mano per il bidding dei bot.
 * Stesso algoritmo di index.html righe 834-841.
 */
export function calculateHandStrength(
  hand: { isJolly: () => boolean; baseScore: number }[],
  _cardsToDeal: number,
): number {
  let strength = 0;
  for (const card of hand) {
    if (card.isJolly()) {
      strength += 1;
    } else if (card.baseScore >= 305) {
      strength += 1;
    } else if (card.baseScore >= 208) {
      strength += 0.7;
    }
  }
  return Math.min(Math.round(strength), _cardsToDeal);
}

/**
 * Calcola il bid per il round Indiana (1 carta).
 * Stesso algoritmo di index.html righe 824-832.
 */
export function calculateIndianaBid(
  myHand: { baseScore: number }[],
  allOtherPlayersHands: { baseScore: number }[][],
): number {
  if (myHand.length === 0) return 0;

  let dangerDetected = false;
  for (const opponentHand of allOtherPlayersHands) {
    for (const card of opponentHand) {
      if (card.baseScore >= 280) {
        dangerDetected = true;
        break;
      }
    }
    if (dangerDetected) break;
  }

  return dangerDetected ? 0 : 1;
}

import { Player } from './player.js';

export interface RoundResult {
  playerId: string;
  playerName: string;
  bid: number;
  taken: number;
  diff: number;
  livesLost: number;
  eliminated: boolean;
  livesRemaining: number;
}

/**
 * Calcola i risultati di fine round: penalità e eliminazioni.
 * Per ogni giocatore attivo:
 *   diff = abs(taken - bid)
 *   se diff > 0: lives -= diff
 *   se lives <= 0: eliminato
 */
export function calculateRoundResults(activePlayers: Player[]): RoundResult[] {
  return activePlayers.map(p => {
    const diff = Math.abs(p.taken - p.bid);
    const livesLost = diff > 0 ? Math.min(diff, p.lives) : 0;
    p.loseLives(diff);

    return {
      playerId: p.id,
      playerName: p.name,
      bid: p.bid,
      taken: p.taken,
      diff,
      livesLost,
      eliminated: p.isEliminated,
      livesRemaining: p.lives,
    };
  });
}

/**
 * Determina se la partita è finita (1 o meno giocatori rimasti).
 */
export function isGameOver(players: Player[]): boolean {
  const alive = players.filter(p => !p.isEliminated);
  return alive.length <= 1;
}

/**
 * Restituisce il vincitore, o null se non c'è ancora un vincitore.
 */
export function getWinner(players: Player[]): Player | null {
  const alive = players.filter(p => !p.isEliminated);
  if (alive.length === 1) return alive[0];
  if (alive.length === 0) return null; // tutti morti stesso round
  return null; // partita ancora in corso
}

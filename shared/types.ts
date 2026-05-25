// Tipi condivisi per BiscaWeb
// Usati sia dal client (frontend) che dal server (game engine)

// --- Semi ---
// L'ORDINE dell'array è critico: determina la gerarchia dei semi.
// Denari (idx 3) > Coppe (idx 2) > Spade (idx 1) > Bastoni (idx 0)
// NON riordinare senza aggiornare tutta la logica di gioco.
export type Suit = 'Bastoni' | 'Spade' | 'Coppe' | 'Denari';

// --- Valori ---
// L'ORDINE dell'array è critico: determina la gerarchia dei valori.
// Asso=1 (il più basso), Re=10 (il più alto).
// NON riordinare senza aggiornare tutta la logica di gioco.
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | 'Fante' | 'Cavallo' | 'Re';

// --- Rango numerico (per confronti veloci) ---
export type RankValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// --- Carta ---
export interface CardData {
  valName: Rank;
  semeName: Suit;
  valIdx: number;   // indice in VALORI (0-9)
  semeIdx: number;  // indice in SEMI (0-3)
  baseScore: number;    // calcolato come semeIdx*100 + valIdx
  effectiveScore: number; // modificato dal jolly (MAX=1000, MIN=-1)
}

// --- Giocatore ---
export interface PlayerData {
  id: string;
  name: string;
  isHuman: boolean;
  lives: number;
  hand: CardData[];
  bid: number;
  taken: number;
  eliminated: boolean;
}

// --- Fasi di gioco ---
export type GamePhase =
  | 'SETUP'
  | 'DEALER_DRAW'
  | 'BIDDING'
  | 'PLAYING'
  | 'ROUND_END'
  | 'GAME_OVER';

// --- Carta sul tavolo ---
export interface TableCardData {
  playerId: string;
  card: CardData;
}

// --- Stato completo della partita ---
export interface GameStateData {
  players: PlayerData[];
  deckRemaining: number;     // carte rimanenti nel mazzo
  tableCards: TableCardData[];
  cardsToDeal: number;
  currentBidsSum: number;
  phase: GamePhase;
  roundStarterIndex: number;  // indice nell'array active players
  currentPlayerIndex: number; // di chi è il turno (-1 se nessuno)
  roundNumber: number;
  duelModeActive: boolean;
}

// --- Vista specifica per giocatore (ciò che un giocatore può vedere) ---
export interface PlayerView {
  yourHand: CardData[];               // le tue carte
  tableCards: TableCardData[];        // carte giocate sul tavolo
  otherPlayers: OtherPlayerView[];    // info pubbliche degli altri
  phase: GamePhase;
  cardsToDeal: number;
  yourBid: number;
  yourTaken: number;
  isYourTurn: boolean;
  allowedBids?: number[];             // disponibili solo in fase BIDDING
  forbiddenBid?: number | null;       // disponibili solo in fase BIDDING
  trickWinnerName?: string;           // disponibile dopo risoluzione presa
}

export interface OtherPlayerView {
  id: string;
  name: string;
  isHuman: boolean;
  lives: number;
  initialLives: number;
  handSize: number;       // numero di carte (il client non vede QUALI carte)
  bid: number;
  taken: number;
  eliminated: boolean;
  isActive: boolean;      // è il turno di questo giocatore?
}

// --- Risultato round ---
export interface RoundResultData {
  playerId: string;
  bid: number;
  taken: number;
  diff: number;
  livesLost: number;
  eliminated: boolean;
}

// --- Configurazione partita ---
export interface GameConfig {
  humanPlayerName: string;
  humanPlayerId: string;
  botNames: string[];
  initialLives: number;
  initialMaxCards: number;
  botCount: number;
}

// --- Messaggi WebSocket (client → server) ---
export type ClientMessage =
  | { type: 'JOIN_LOBBY'; lobbyId: string }
  | { type: 'CREATE_LOBBY'; name: string; isPrivate: boolean; maxPlayers: number }
  | { type: 'LEAVE_LOBBY' }
  | { type: 'READY' }
  | { type: 'MAKE_BID'; gameId: string; value: number }
  | { type: 'PLAY_CARD'; gameId: string; cardIdx: number }
  | { type: 'JOLLY_CHOICE'; gameId: string; choice: 'MAX' | 'MIN' }
  | { type: 'CHAT_MESSAGE'; text: string };

// --- Messaggi WebSocket (server → client) ---
export type ServerMessage =
  | { type: 'LOBBY_UPDATE'; players: any[]; status: string }
  | { type: 'GAME_STARTING'; countdown: number }
  | { type: 'ROUND_START'; cardsToDeal: number; yourHand: CardData[] }
  | { type: 'BID_REQUEST'; timeout: number; allowedBids: number[]; forbiddenBid: number | null }
  | { type: 'BID_UPDATE'; playerId: string; playerName: string; value: number }
  | { type: 'PLAY_REQUEST'; timeout: number }
  | { type: 'CARD_PLAYED'; playerId: string; playerName: string; card: CardData }
  | { type: 'TRICK_RESULT'; winnerId: string; winnerName: string }
  | { type: 'ROUND_END'; results: RoundResultData[] }
  | { type: 'GAME_OVER'; winner: { id: string; name: string }; stats: any }
  | { type: 'ERROR'; code: string; message: string }
  | { type: 'PLAYER_VIEW'; view: PlayerView };

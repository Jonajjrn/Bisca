# 05 — Piano per il multiplayer online

## Due strade possibili

### Strada A: REST + Polling

Il client chiama endpoint REST a ogni azione e fa polling periodico per vedere lo stato aggiornato.

```
Client ── POST /api/game/:id/play-card ──► Server
Client ◄── 200 { state } ──────────────── Server

Client ── GET /api/game/:id/state ───────► Server (ogni 2 secondi)
Client ◄── 200 { state } ──────────────── Server
```

**Pro**:
- Semplice da implementare (API REST standard)
- Facile da debuggare (ogni richiesta è indipendente)
- Funziona bene con framework HTTP standard (Express, Fastify)
- Cache-friendly per alcune risorse (storico partite, profili)
- Non richiede connessione persistente

**Contro**:
- Latenza aggiuntiva (fino a 2 secondi di polling)
- Spreco di banda (polling anche quando non ci sono cambiamenti)
- Non scala bene con molti giocatori (N client × polling interval)
- Riconnessione complessa (devi ricostruire lo stato)
- Notifiche in tempo reale impossibili (messaggi chat, timer lobby)
- Gioco "a turni" forzato (attendere il polling per vedere la mossa)

**Complessità**: Bassa (sviluppo), Media (esercizio)
**Rischi**: Esperienza utente scadente, lag percepito
**Quando conviene**: Solo per prototipo iniziale o gioco puramente asincrono (a turni con tempo illimitato)

---

### Strada B: WebSocket (consigliata)

Il client mantiene una connessione WebSocket persistente col game server. Messaggi bidirezionali in tempo reale.

```
Client ◄═══════════ WebSocket ═══════════► Game Server
         ↕                                 
    Messaggi JSON:                        
    { type: "PLAY_CARD", cardIdx: 2 }     
    { type: "STATE_UPDATE", state: {...} } 
```

**Pro**:
- Latenza minima (sub-100ms)
- Comunicazione bidirezionale (il server pusha lo stato)
- Nessun polling = meno banda, meno CPU
- Riconnessione gestibile (Socket.IO ha reconnect built-in)
- Notifiche in tempo reale (chat, timer, inviti)
- Supporto per stanze/lobby via Socket.IO rooms
- Scaling orizzontale con Redis adapter

**Contro**:
- Più complesso da implementare e debuggare
- Richiede gestione stato per connessione (sticky session o adapter)
- Stateful (il server tiene stato tra le richieste)
- Potenziali problemi con proxy/load balancer (necessario WebSocket upgrade)
- Più difficile da testare (necessario client WebSocket nei test)

**Complessità**: Alta (sviluppo), Media (esercizio)
**Rischi**: Overhead iniziale di setup, curva di apprendimento
**Quando conviene**: Qualsiasi gioco multiplayer in tempo reale

---

## Architettura consigliata: Strada B (WebSocket)

### Perché WebSocket

Per un gioco di carte come la Bisca, il pacing è:
- Fase bidding: tutti devono dichiarare (turni sequenziali, ma tutti devono vedere le dichiarazioni)
- Fase gioco: ogni giocatore cala una carta a turno
- Risoluzione presa: tutti vedono il risultato simultaneamente

Con REST + polling, il ritardo percepito sarebbe frustrante. WebSocket permette:
1. Il server notifica "è il tuo turno" istantaneamente
2. Tutti vedono la carta giocata subito
3. Timer di inattività lato server con notifica a tutti
4. Chat in tempo reale

### Stack WebSocket consigliato

**Socket.IO** (non WebSocket raw) perché fornisce:
- Auto-reconnect con backoff esponenziale
- Fallback a long-polling se WebSocket non disponibile
- Rooms (per lobby e partite)
- Acknowledgements (richiesta/risposta con callback)
- Middleware per autenticazione
- Namespace per separare lobby, game, chat

### Flusso di comunicazione

```
CLIENT                          SERVER
  │                                │
  │──── CONNECT (auth token) ─────►│  Autenticazione via middleware
  │◄─── connected ────────────────│
  │                                │
  │──── JOIN_LOBBY (lobbyId) ─────►│  Entra in room Socket.IO
  │◄─── LOBBY_UPDATE ─────────────│  Stato lobby (giocatori, ready)
  │                                │
  │──── READY ────────────────────►│
  │◄─── GAME_STARTING ────────────│  Timer countdown
  │                                │
  │◄─── ROUND_START (hand, bidOrder)─│  Il server distribuisce
  │                                │
  │◄─── BID_REQUEST ──────────────│  "Tocca a te dichiarare"
  │──── MAKE_BID (value) ─────────►│  Validazione server
  │◄─── BID_UPDATE (player, bid) ──│  Broadcast a tutti
  │                                │
  │◄─── PLAY_REQUEST ─────────────│  "Tocca a te giocare"
  │──── PLAY_CARD (cardIdx) ──────►│  Validazione server
  │◄─── CARD_PLAYED (player, card)─│  Broadcast (info limitata)
  │                                │
  │◄─── TRICK_RESULT (winner) ────│  Broadcast
  │◄─── ROUND_END (results) ──────│  Penalità, eliminazioni
  │                                │
  │◄─── GAME_OVER (winner, stats)──│  Broadcast finale
```

### Messaggi dettagliati

```typescript
// Client → Server
type ClientMessage =
  | { type: "JOIN_LOBBY"; lobbyId: string }
  | { type: "CREATE_LOBBY"; name: string; isPrivate: boolean; maxPlayers: number }
  | { type: "READY" }
  | { type: "MAKE_BID"; gameId: string; value: number }
  | { type: "PLAY_CARD"; gameId: string; cardIdx: number }
  | { type: "JOLLY_CHOICE"; choice: "MAX" | "MIN" }
  | { type: "CHAT_MESSAGE"; text: string }

// Server → Client
type ServerMessage =
  | { type: "LOBBY_UPDATE"; players: LobbyPlayer[]; status: LobbyStatus }
  | { type: "GAME_STARTING"; countdown: number }
  | { type: "ROUND_START"; cardsToDeal: number; yourHand: CardInfo[] }
  | { type: "BID_REQUEST"; timeout: number }
  | { type: "BID_UPDATE"; playerId: string; playerName: string; value: number }
  | { type: "PLAY_REQUEST"; timeout: number; tableCards: TableCardInfo[] }
  | { type: "CARD_PLAYED"; playerId: string; playerName: string; card: CardInfo }
  | { type: "TRICK_RESULT"; winnerId: string; winnerName: string }
  | { type: "ROUND_END"; results: RoundResult[] }
  | { type: "GAME_OVER"; winner: WinnerInfo; stats: GameStats }
  | { type: "ERROR"; code: string; message: string }
```

### Il principio fondamentale

**Il client è uno "stupido renderer" di stato.** Non prende mai decisioni di gioco. Il server dice al client cosa mostrare e il client risponde con le azioni dell'utente.

Il server DEVE:
- Creare e mescolare il mazzo
- Distribuire le carte (inviando al client SOLO la sua mano)
- Ricevere i bid e validarli
- Determinare il vincitore di ogni presa
- Calcolare penalità ed eliminazioni
- Decidere la fine della partita

Il server NON DEVE MAI:
- Inviare al client le carte degli altri giocatori (tranne quando visibili per regole)
- Fidarsi di un bid/azione senza validazione
- Accettare un `effectiveScore` dal client
- Permettere al client di saltare turni o modificare lo stato

---

## Gestione riconnessione

```
Cliente si disconnette
        │
        ▼
Server: setta giocatore come "disconnected"
        │
        ▼
Partita in corso?
  ├─ SÌ: Il bot prende il controllo temporaneo
  │       Timer riconnessione: 60 secondi
  │       │
  │       ├─ Rientra entro 60s → riprende controllo
  │       └─ Non rientra → bot continua, giocatore = sconfitta
  │
  └─ NO (lobby): rimuovi dopo 30 secondi
```

**Implementazione tecnica**:
- Socket.IO invia evento `disconnect`
- Il server avvia un timer
- Se il client si riconnette con lo stesso `sessionId`, riprende il controllo
- Il client, alla riconnessione, chiede `GET /api/game/:id/state` per ricostruire lo stato completo

---

## Gestione abbandono partita

- **Abbandono volontario** (clicca "Abbandona"): il giocatore viene eliminato, gli altri continuano
- **Abbandono involontario** (disconnessione): vedi "riconnessione" sopra
- **AFK (away from keyboard)**: timeout turno (30 secondi), poi il bot gioca automaticamente

Penalità per abbandono:
- Perdita della moneta virtuale d'ingresso (se presente buy-in)
- Partita contata come sconfitta
- Dopo N abbandoni in un periodo: cooldown temporaneo dal matchmaking

---

## Spettatori

Per la Bisca, gli spettatori non sono prioritari ma possono essere implementati:

- **Room Socket.IO separata**: `game:{id}:spectators`
- Lo spettatore riceve lo stesso flusso di eventi dei giocatori
- Ma con le carte degli altri giocatori nascoste (o mostrate, a scelta della lobby)
- Non può inviare messaggi `PLAY_CARD` o `MAKE_BID`
- Può inviare messaggi chat marcati come "spettatore"

---

## Scaling

Per un MVP (<1000 giocatori simultanei), un singolo processo Node.js con Socket.IO gestisce tutto.

Per scaling orizzontale:
- **Socket.IO Redis adapter**: le stanze sono condivise tra più processi
- **Sticky session** non necessaria con Redis adapter
- **Game server dedicato**: un processo separato per le partite attive (stato in memoria)
- **API server**: REST per autenticazione, storico, profilo (stateless, facile da scalare)

```
                   ┌──────────┐
                   │  Nginx   │ (terminazione TLS, proxy)
                   └────┬─────┘
           ┌────────────┼────────────┐
           ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ API      │ │ API      │ │ Game     │
    │ Server 1 │ │ Server 2 │ │ Server 1 │
    └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │
         └────────────┼────────────┘
                      │
           ┌──────────┴──────────┐
           │       Redis         │ (pub/sub, session, rate limit)
           └─────────────────────┘
                      │
           ┌──────────┴──────────┐
           │    PostgreSQL       │ (utenti, storico, wallet)
           └─────────────────────┘
```
